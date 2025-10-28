import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simple Flow Engine - Easy integration with any Node.js backend
 */

export interface FlowStep {
  id: string;
  handler: (data: any, context: FlowContext) => Promise<any>;
  dependencies?: string[];
  retries?: number;
  timeout?: number;
}

export interface FlowContext {
  executionId: string;
  startTime: number;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface FlowResult {
  success: boolean;
  data: any;
  error?: string;
  executionTime: number;
  steps: string[];
  metadata: Record<string, any>;
}

export class SimpleFlowEngine extends EventEmitter {
  private steps: Map<string, FlowStep> = new Map();
  private stepOrder: string[] = [];
  private commonPayload: any = {};
  private middleware: Array<(data: any, context: FlowContext) => Promise<any>> = [];

  constructor() {
    super();
  }

  /**
   * Set common payload/data that will be available to all steps
   */
  setCommonPayload(payload: any): this {
    this.commonPayload = payload;
    return this;
  }

  /**
   * Add middleware that runs before each step
   */
  use(middleware: (data: any, context: FlowContext) => Promise<any>): this {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * Add a step to the workflow
   */
  step(
    id: string, 
    handler: (data: any, context: FlowContext) => Promise<any>,
    options?: { retries?: number; timeout?: number; dependencies?: string[] }
  ): this {
    const step: FlowStep = {
      id,
      handler,
      retries: options?.retries || 0,
      timeout: options?.timeout || 30000,
      dependencies: options?.dependencies || []
    };

    this.steps.set(id, step);
    
    // Add to step order if not already present
    if (!this.stepOrder.includes(id)) {
      this.stepOrder.push(id);
    }

    return this;
  }

  /**
   * Execute the workflow
   */
  async execute(inputData: any = {}): Promise<FlowResult> {
    const executionId = uuidv4();
    const startTime = Date.now();
    const executedSteps: string[] = [];
    
    // Merge input data with common payload
    const data = { ...this.commonPayload, ...inputData };
    
    const context: FlowContext = {
      executionId,
      startTime,
      variables: { ...data },
      metadata: {}
    };

    try {
      this.emit('flow:started', { executionId, data });

      // Execute steps in order
      for (const stepId of this.stepOrder) {
        const step = this.steps.get(stepId);
        if (!step) continue;

        // Check dependencies
        if (step.dependencies && step.dependencies.length > 0) {
          const unmetDeps = step.dependencies.filter(dep => !executedSteps.includes(dep));
          if (unmetDeps.length > 0) {
            throw new Error(`Step ${stepId} has unmet dependencies: ${unmetDeps.join(', ')}`);
          }
        }

        // Run middleware
        for (const middleware of this.middleware) {
          await middleware(data, context);
        }

        // Execute step with retries
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= (step.retries || 0); attempt++) {
          try {
            this.emit('step:started', { stepId, attempt, data });
            
            const stepResult = await this.executeWithTimeout(
              step.handler(data, context),
              step.timeout || 30000
            );

            // Update data with step result
            Object.assign(data, stepResult);
            Object.assign(context.variables, stepResult);
            
            executedSteps.push(stepId);
            this.emit('step:completed', { stepId, result: stepResult });
            break;

          } catch (error) {
            lastError = error as Error;
            this.emit('step:failed', { stepId, attempt, error });
            
            if (attempt === (step.retries || 0)) {
              throw lastError;
            }
            
            // Wait before retry (exponential backoff)
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const result: FlowResult = {
        success: true,
        data,
        executionTime,
        steps: executedSteps,
        metadata: context.metadata
      };

      this.emit('flow:completed', result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: FlowResult = {
        success: false,
        data,
        error: (error as Error).message,
        executionTime,
        steps: executedSteps,
        metadata: context.metadata
      };

      this.emit('flow:failed', result);
      return result;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Step timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get workflow info
   */
  getInfo() {
    return {
      steps: Array.from(this.steps.keys()),
      stepOrder: this.stepOrder,
      hasCommonPayload: Object.keys(this.commonPayload).length > 0,
      middlewareCount: this.middleware.length
    };
  }

  /**
   * Clear all steps
   */
  clear(): this {
    this.steps.clear();
    this.stepOrder = [];
    this.middleware = [];
    this.commonPayload = {};
    return this;
  }
}

/**
 * Factory function for creating flows
 */
export function createFlow(): SimpleFlowEngine {
  return new SimpleFlowEngine();
}

/**
 * Express middleware integration
 */
export function expressFlow(flow: SimpleFlowEngine) {
  return async (req: any, res: any, next: any) => {
    try {
      const result = await flow.execute(req.body);
      
      if (result.success) {
        req.flowResult = result;
        next();
      } else {
        res.status(400).json({
          error: result.error,
          executionTime: result.executionTime
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Flow execution failed',
        details: (error as Error).message
      });
    }
  };
}

/**
 * Fastify plugin integration
 */
export function fastifyFlow(flow: SimpleFlowEngine) {
  return async (request: any, reply: any) => {
    try {
      const result = await flow.execute(request.body);
      
      if (result.success) {
        return result.data;
      } else {
        reply.code(400);
        return {
          error: result.error,
          executionTime: result.executionTime
        };
      }
    } catch (error) {
      reply.code(500);
      return {
        error: 'Flow execution failed',
        details: (error as Error).message
      };
    }
  };
}