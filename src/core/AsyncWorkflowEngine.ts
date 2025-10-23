import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { Workflow, WorkflowNode, WorkflowEdge, ComponentInfo } from '../types';

export interface AsyncWorkflowOptions {
  maxConcurrency: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
}

export interface WorkflowExecutionContext {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  progress: number;
  currentStep: string;
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'sync' | 'async' | 'parallel' | 'conditional' | 'loop' | 'error-handler';
  execute: (context: WorkflowExecutionContext) => Promise<any>;
  dependencies: string[];
  timeout?: number;
  retryAttempts?: number;
  onSuccess?: (result: any, context: WorkflowExecutionContext) => Promise<void>;
  onError?: (error: Error, context: WorkflowExecutionContext) => Promise<void>;
  onComplete?: (result: any, context: WorkflowExecutionContext) => Promise<void>;
}

export class AsyncWorkflowEngine extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecutionContext> = new Map();
  private workers: Worker[] = [];
  private options: AsyncWorkflowOptions;
  private metrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    cacheHits: number;
    cacheMisses: number;
  } = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(options: Partial<AsyncWorkflowOptions> = {}) {
    super();
    this.options = {
      maxConcurrency: 10,
      timeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      enableCaching: true,
      enableMetrics: true,
      enableLogging: true,
      ...options
    };
  }

  /**
   * Register a workflow for execution
   */
  public registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    this.emit('workflow:registered', { workflowId: workflow.id });
  }

  /**
   * Execute a workflow asynchronously
   */
  public async executeWorkflow(
    workflowId: string, 
    input: any = {}, 
    options: Partial<AsyncWorkflowOptions> = {}
  ): Promise<WorkflowExecutionContext> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const context: WorkflowExecutionContext = {
      id: executionId,
      status: 'pending',
      startTime: Date.now(),
      progress: 0,
      currentStep: 'initializing',
      errors: [],
      warnings: [],
      metadata: { input, workflowId }
    };

    this.executions.set(executionId, context);
    this.emit('execution:started', { executionId, workflowId });

    try {
      await this.executeWorkflowSteps(workflow, context, { ...this.options, ...options });
      context.status = 'completed';
      context.endTime = Date.now();
      context.progress = 100;
      
      this.metrics.totalExecutions++;
      this.metrics.successfulExecutions++;
      this.updateAverageExecutionTime(context);
      
      this.emit('execution:completed', { executionId, context });
    } catch (error) {
      context.status = 'failed';
      context.endTime = Date.now();
      context.errors.push(error instanceof Error ? error.message : String(error));
      
      this.metrics.totalExecutions++;
      this.metrics.failedExecutions++;
      
      this.emit('execution:failed', { executionId, error, context });
      throw error;
    }

    return context;
  }

  /**
   * Execute multiple workflows in parallel
   */
  public async executeWorkflowsParallel(
    workflowIds: string[], 
    input: any = {}, 
    options: Partial<AsyncWorkflowOptions> = {}
  ): Promise<WorkflowExecutionContext[]> {
    const executions = workflowIds.map(workflowId => 
      this.executeWorkflow(workflowId, input, options)
    );

    return Promise.all(executions);
  }

  /**
   * Execute workflows in sequence
   */
  public async executeWorkflowsSequence(
    workflowIds: string[], 
    input: any = {}, 
    options: Partial<AsyncWorkflowOptions> = {}
  ): Promise<WorkflowExecutionContext[]> {
    const executions: WorkflowExecutionContext[] = [];
    
    for (const workflowId of workflowIds) {
      const execution = await this.executeWorkflow(workflowId, input, options);
      executions.push(execution);
      
      // Pass output of previous workflow as input to next
      if (execution.metadata.output) {
        input = { ...input, ...execution.metadata.output };
      }
    }

    return executions;
  }

  /**
   * Execute workflows with conditional logic
   */
  public async executeWorkflowsConditional(
    conditions: Array<{
      condition: (context: WorkflowExecutionContext) => boolean;
      workflowId: string;
      input?: any;
    }>,
    defaultWorkflowId?: string,
    options: Partial<AsyncWorkflowOptions> = {}
  ): Promise<WorkflowExecutionContext[]> {
    const executions: WorkflowExecutionContext[] = [];
    let context: WorkflowExecutionContext | null = null;

    for (const condition of conditions) {
      if (condition.condition(context || { id: '', status: 'pending', startTime: Date.now(), progress: 0, currentStep: '', errors: [], warnings: [], metadata: {} })) {
        const execution = await this.executeWorkflow(condition.workflowId, condition.input, options);
        executions.push(execution);
        context = execution;
      }
    }

    if (defaultWorkflowId && executions.length === 0) {
      const execution = await this.executeWorkflow(defaultWorkflowId, {}, options);
      executions.push(execution);
    }

    return executions;
  }

  /**
   * Execute workflows in a loop
   */
  public async executeWorkflowsLoop(
    workflowId: string,
    loopCondition: (context: WorkflowExecutionContext) => boolean,
    input: any = {},
    options: Partial<AsyncWorkflowOptions> = {}
  ): Promise<WorkflowExecutionContext[]> {
    const executions: WorkflowExecutionContext[] = [];
    let context: WorkflowExecutionContext | null = null;

    while (loopCondition(context || { id: '', status: 'pending', startTime: Date.now(), progress: 0, currentStep: '', errors: [], warnings: [], metadata: {} })) {
      const execution = await this.executeWorkflow(workflowId, input, options);
      executions.push(execution);
      context = execution;
    }

    return executions;
  }

  /**
   * Cancel a running execution
   */
  public async cancelExecution(executionId: string): Promise<void> {
    const context = this.executions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (context.status === 'running') {
      context.status = 'cancelled';
      context.endTime = Date.now();
      this.emit('execution:cancelled', { executionId, context });
    }
  }

  /**
   * Get execution status
   */
  public getExecutionStatus(executionId: string): WorkflowExecutionContext | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get all executions
   */
  public getAllExecutions(): WorkflowExecutionContext[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get metrics
   */
  public getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalExecutions > 0 
        ? (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100 
        : 0,
      failureRate: this.metrics.totalExecutions > 0 
        ? (this.metrics.failedExecutions / this.metrics.totalExecutions) * 100 
        : 0
    };
  }

  /**
   * Clear all executions
   */
  public clearExecutions(): void {
    this.executions.clear();
    this.emit('executions:cleared');
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // Terminate all workers
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
    
    // Clear all data
    this.workflows.clear();
    this.executions.clear();
    
    this.emit('engine:cleaned');
  }

  private async executeWorkflowSteps(
    workflow: Workflow, 
    context: WorkflowExecutionContext, 
    options: AsyncWorkflowOptions
  ): Promise<void> {
    context.status = 'running';
    context.currentStep = 'executing';

    const steps = this.createWorkflowSteps(workflow);
    const totalSteps = steps.length;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      context.currentStep = step.name;
      context.progress = Math.round((i / totalSteps) * 100);

      this.emit('step:started', { executionId: context.id, step: step.name });

      try {
        const result = await this.executeStep(step, context, options);
        context.metadata[`step_${step.id}_result`] = result;
        
        if (step.onSuccess) {
          await step.onSuccess(result, context);
        }
        
        this.emit('step:completed', { executionId: context.id, step: step.name, result });
      } catch (error) {
        context.errors.push(`Step ${step.name} failed: ${error instanceof Error ? error.message : String(error)}`);
        
        if (step.onError) {
          await step.onError(error as Error, context);
        }
        
        this.emit('step:failed', { executionId: context.id, step: step.name, error });
        
        if (step.type === 'error-handler') {
          continue; // Error handlers should not stop execution
        } else {
          throw error;
        }
      }
    }

    context.progress = 100;
  }

  private createWorkflowSteps(workflow: Workflow): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    
    // Create steps from workflow nodes
    workflow.nodes.forEach(node => {
      const step: WorkflowStep = {
        id: node.id,
        name: node.label,
        type: this.determineStepType(node),
        execute: async (context) => {
          return await this.executeNode(node, context);
        },
        dependencies: this.getNodeDependencies(node, workflow),
        timeout: 30000, // 30 seconds default
        retryAttempts: 3
      };
      
      steps.push(step);
    });

    return steps;
  }

  private determineStepType(node: WorkflowNode): WorkflowStep['type'] {
    switch (node.type) {
      case 'start':
      case 'end':
        return 'sync';
      case 'process':
        return 'async';
      case 'decision':
        return 'conditional';
      case 'loop':
        return 'loop';
      case 'database':
      case 'api':
        return 'async';
      default:
        return 'sync';
    }
  }

  private getNodeDependencies(node: WorkflowNode, workflow: Workflow): string[] {
    return workflow.edges
      .filter(edge => edge.target === node.id)
      .map(edge => edge.source);
  }

  private async executeStep(
    step: WorkflowStep, 
    context: WorkflowExecutionContext, 
    options: AsyncWorkflowOptions
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        step.execute(context),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Step timeout')), step.timeout || options.timeout)
        )
      ]);
      
      const executionTime = Date.now() - startTime;
      this.emit('step:metrics', { 
        stepId: step.id, 
        executionTime, 
        success: true 
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.emit('step:metrics', { 
        stepId: step.id, 
        executionTime, 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  private async executeNode(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    // This is a placeholder - in real implementation, this would execute
    // the actual logic based on the node type and data
    return {
      nodeId: node.id,
      nodeType: node.type,
      result: `Executed ${node.label}`,
      timestamp: new Date().toISOString()
    };
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateAverageExecutionTime(context: WorkflowExecutionContext): void {
    if (context.endTime) {
      const executionTime = context.endTime - context.startTime;
      this.metrics.averageExecutionTime = 
        (this.metrics.averageExecutionTime + executionTime) / 2;
    }
  }
}
