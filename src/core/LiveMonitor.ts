import { EventEmitter } from 'events';
import { FlowInstance, FlowResult } from '../types';
import { FlowLogger } from './FlowLogger';

/**
 * LiveMonitor - Real-time monitoring and logging for Flow Engine
 */
export class LiveMonitor extends EventEmitter {
  private logger: FlowLogger;
  private liveData: {
    activeFlows: FlowInstance[];
    recentExecutions: FlowResult[];
    systemMetrics: {
      memoryUsage: number;
      cpuUsage: number;
      activeConnections: number;
    };
    performanceMetrics: {
      averageExecutionTime: number;
      successRate: number;
      errorRate: number;
    };
  } = {
    activeFlows: [],
    recentExecutions: [],
    systemMetrics: {
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0
    },
    performanceMetrics: {
      averageExecutionTime: 0,
      successRate: 0,
      errorRate: 0
    }
  };

  constructor() {
    super();
    this.logger = new FlowLogger();
    this.startMonitoring();
  }

  /**
   * Start live monitoring
   */
  private startMonitoring(): void {
    // Update system metrics every 5 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000);

    // Clean up old execution data every minute
    setInterval(() => {
      this.cleanupOldData();
    }, 60000);
  }

  /**
   * Log flow registration
   */
  logFlowRegistration(definition: any): void {
    this.logger.info(`📋 Flow Definition Registered: ${definition.name}`);
    this.emit('monitor:flow-registered', definition);
  }

  /**
   * Log flow start
   */
  logFlowStart(instance: FlowInstance): void {
    this.liveData.activeFlows.push(instance);
    this.logger.info(`🚀 Flow Started: ${instance.flowId} (${instance.id})`);
    this.emit('monitor:flow-started', instance);
  }

  /**
   * Log flow completion
   */
  logFlowComplete(result: FlowResult): void {
    // Remove from active flows
    this.liveData.activeFlows = this.liveData.activeFlows.filter(
      flow => flow.id !== result.id
    );

    // Add to recent executions (keep last 100)
    this.liveData.recentExecutions.unshift(result);
    if (this.liveData.recentExecutions.length > 100) {
      this.liveData.recentExecutions = this.liveData.recentExecutions.slice(0, 100);
    }

    this.logger.info(`✅ Flow Completed: ${result.flowId} (${result.executionTime}ms)`);
    this.emit('monitor:flow-completed', result);
  }

  /**
   * Log flow error
   */
  logFlowError(flowId: string, executionId: string, error: any): void {
    this.logger.error(`❌ Flow Failed: ${flowId} (${executionId})`, error);
    this.emit('monitor:flow-error', { flowId, executionId, error });
  }

  /**
   * Log cache hit
   */
  logCacheHit(flowId: string, executionId: string): void {
    this.logger.info(`💾 Cache Hit: ${flowId} (${executionId})`);
    this.emit('monitor:cache-hit', { flowId, executionId });
  }

  /**
   * Update system metrics
   */
  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.liveData.systemMetrics = {
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      activeConnections: this.liveData.activeFlows.length
    };

    this.emit('monitor:metrics-updated', this.liveData.systemMetrics);
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.liveData.recentExecutions = this.liveData.recentExecutions.filter(
      execution => execution.startTime > oneHourAgo
    );
  }

  /**
   * Get live monitoring data
   */
  getLiveData() {
    return {
      ...this.liveData,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const totalExecutions = this.liveData.recentExecutions.length;
    const successfulExecutions = this.liveData.recentExecutions.filter(
      exec => exec.status === 'completed'
    ).length;
    const failedExecutions = totalExecutions - successfulExecutions;

    const averageExecutionTime = totalExecutions > 0 
      ? this.liveData.recentExecutions.reduce((sum, exec) => sum + exec.executionTime, 0) / totalExecutions
      : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      errorRate: totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime: Math.round(averageExecutionTime),
      activeFlows: this.liveData.activeFlows.length
    };
  }

  /**
   * Get flow execution history
   */
  getExecutionHistory(limit: number = 50) {
    return this.liveData.recentExecutions.slice(0, limit);
  }

  /**
   * Get active flows details
   */
  getActiveFlowsDetails() {
    return this.liveData.activeFlows.map(flow => ({
      id: flow.id,
      flowId: flow.flowId,
      status: flow.status,
      startTime: flow.startTime,
      currentNode: flow.currentNode,
      memoryUsage: flow.memoryUsage,
      duration: Date.now() - flow.startTime
    }));
  }

  /**
   * Cleanup monitoring resources
   */
  cleanup(): void {
    this.liveData.activeFlows = [];
    this.liveData.recentExecutions = [];
    this.logger.info('🧹 Live monitoring cleaned up');
  }
}
