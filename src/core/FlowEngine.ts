import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { FlowDefinition, FlowInstance, FlowNode, FlowEdge, FlowContext, FlowResult } from '../types';
import { MemoryManager } from './MemoryManager';
import { TaskExecutor } from './TaskExecutor';
import { FlowCache } from './FlowCache';
import { FlowLogger } from './FlowLogger';
import { LiveMonitor } from './LiveMonitor';

/**
 * FlowEngine - The core engine that replaces traditional controllers
 * with efficient workflow-based processing and live monitoring
 */
export class FlowEngine extends EventEmitter {
  private memoryManager: MemoryManager;
  private taskExecutor: TaskExecutor;
  private flowCache: FlowCache;
  private logger: FlowLogger;
  private monitor: LiveMonitor;
  private activeFlows: Map<string, FlowInstance> = new Map();
  private flowDefinitions: Map<string, FlowDefinition> = new Map();
  private metrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    memoryUsage: number;
  } = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0,
    memoryUsage: 0
  };

  constructor() {
    super();
    this.memoryManager = new MemoryManager();
    this.taskExecutor = new TaskExecutor();
    this.flowCache = new FlowCache();
    this.logger = new FlowLogger();
    this.monitor = new LiveMonitor();
    
    this.setupEventHandlers();
  }

  /**
   * Register a flow definition
   */
  async registerFlow(definition: FlowDefinition): Promise<void> {
    this.flowDefinitions.set(definition.id, definition);
    this.logger.info(`🌊 Flow registered: ${definition.name} (${definition.id})`);
    this.monitor.logFlowRegistration(definition);
  }

  /**
   * Execute a flow - This replaces traditional controller methods
   */
  async executeFlow(
    flowId: string, 
    input: any, 
    context?: Partial<FlowContext>
  ): Promise<FlowResult> {
    const startTime = Date.now();
    const executionId = uuidv4();
    
    try {
      // Get flow definition
      const definition = this.flowDefinitions.get(flowId);
      if (!definition) {
        throw new Error(`Flow not found: ${flowId}`);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(flowId, input);
      const cachedResult = await this.flowCache.get(cacheKey);
      if (cachedResult) {
        this.logger.info(`💾 Cache hit for flow: ${flowId}`);
        this.monitor.logCacheHit(flowId, executionId);
        return cachedResult;
      }

      // Create flow instance
      const instance: FlowInstance = {
        id: executionId,
        flowId,
        status: 'running',
        startTime,
        input,
        context: { ...context, executionId },
        currentNode: definition.startNode,
        variables: { ...input },
        memoryUsage: 0
      };

      this.activeFlows.set(executionId, instance);
      this.monitor.logFlowStart(instance);
      this.emit('flow:started', instance);

      // Execute flow
      const result = await this.executeFlowInstance(instance, definition);
      
      // Update metrics
      this.updateMetrics(result);
      
      // Cache result
      await this.flowCache.set(cacheKey, result);
      
      // Cleanup
      this.activeFlows.delete(executionId);
      this.monitor.logFlowComplete(result);
      this.emit('flow:completed', result);

      return result;

    } catch (error) {
      this.logger.error(`❌ Flow execution failed: ${flowId}`, error);
      this.monitor.logFlowError(flowId, executionId, error);
      this.emit('flow:failed', { flowId, executionId, error });
      throw error;
    }
  }

  /**
   * Execute flow instance with memory optimization
   */
  private async executeFlowInstance(
    instance: FlowInstance, 
    definition: FlowDefinition
  ): Promise<FlowResult> {
    const nodes = new Map(definition.nodes.map(node => [node.id, node]));
    const edges = new Map(definition.edges.map(edge => [edge.source, edge]));
    
    let currentNode = definition.startNode;
    const executionPath: string[] = [];
    const results: any[] = [];

    while (currentNode) {
      const node = nodes.get(currentNode);
      if (!node) {
        throw new Error(`Node not found: ${currentNode}`);
      }

      // Memory optimization: Only load necessary data
      const nodeContext = this.createNodeContext(instance, node);
      
      // Execute node
      const nodeResult = await this.executeNode(node, nodeContext);
      results.push(nodeResult);
      executionPath.push(currentNode);

      // Update instance variables
      instance.variables = { ...instance.variables, ...nodeResult.output };
      instance.currentNode = currentNode;

      // Find next node
      const edge = edges.get(currentNode);
      if (edge && edge.condition && !this.evaluateCondition(edge.condition, instance.variables)) {
        break; // Condition not met, flow ends
      }

      currentNode = edge?.target || null;
    }

    const endTime = Date.now();
    const memoryUsage = this.memoryManager.getCurrentUsage();

    return {
      id: instance.id,
      flowId: instance.flowId,
      status: 'completed',
      startTime: instance.startTime,
      endTime,
      executionTime: endTime - instance.startTime,
      executionPath,
      results,
      output: instance.variables,
      memoryUsage,
      performance: {
        nodesExecuted: executionPath.length,
        memoryPeak: memoryUsage,
        cacheHits: 0, // TODO: Implement cache hit tracking
        cacheMisses: 1
      }
    };
  }

  /**
   * Execute a single flow node
   */
  private async executeNode(node: FlowNode, context: FlowContext): Promise<any> {
    this.logger.info(`⚡ Executing node: ${node.id} (${node.type})`);
    
    // Memory optimization: Use task executor for efficient processing
    const result = await this.taskExecutor.execute(node, context);
    
    // Update memory usage
    this.memoryManager.updateUsage(node.id, result.memoryUsage || 0);
    
    return {
      nodeId: node.id,
      type: node.type,
      output: result.output,
      memoryUsage: result.memoryUsage,
      executionTime: result.executionTime
    };
  }

  /**
   * Create optimized context for node execution
   */
  private createNodeContext(instance: FlowInstance, node: FlowNode): FlowContext {
    return {
      executionId: instance.id,
      flowId: instance.flowId,
      nodeId: node.id,
      variables: { ...instance.variables },
      input: instance.input,
      config: node.config || {},
      memory: this.memoryManager.getAvailableMemory()
    };
  }

  /**
   * Evaluate edge condition
   */
  private evaluateCondition(condition: string, variables: any): boolean {
    try {
      // Simple condition evaluation - can be enhanced
      return new Function('variables', `return ${condition}`)(variables);
    } catch (error) {
      this.logger.error(`Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  /**
   * Generate cache key for flow execution
   */
  private generateCacheKey(flowId: string, input: any): string {
    const inputHash = JSON.stringify(input);
    return `${flowId}:${Buffer.from(inputHash).toString('base64')}`;
  }

  /**
   * Update metrics
   */
  private updateMetrics(result: FlowResult): void {
    this.metrics.totalExecutions++;
    this.metrics.successfulExecutions++;
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + result.executionTime) / 
      this.metrics.totalExecutions;
    this.metrics.memoryUsage = this.memoryManager.getCurrentUsage();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('flow:started', (instance) => {
      this.monitor.logFlowStart(instance);
    });

    this.on('flow:completed', (result) => {
      this.monitor.logFlowComplete(result);
    });

    this.on('flow:failed', (error) => {
      this.metrics.failedExecutions++;
      this.monitor.logFlowError(error.flowId, error.executionId, error.error);
    });
  }

  /**
   * Get active flows (for monitoring)
   */
  getActiveFlows(): FlowInstance[] {
    return Array.from(this.activeFlows.values());
  }

  /**
   * Get flow statistics
   */
  getStatistics() {
    return {
      activeFlows: this.activeFlows.size,
      registeredFlows: this.flowDefinitions.size,
      memoryUsage: this.memoryManager.getCurrentUsage(),
      cacheStats: this.flowCache.getStats(),
      metrics: this.metrics
    };
  }

  /**
   * Get live monitoring data
   */
  getLiveData() {
    return this.monitor.getLiveData();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.activeFlows.clear();
    await this.flowCache.clear();
    await this.memoryManager.cleanup();
    this.monitor.cleanup();
  }
}
