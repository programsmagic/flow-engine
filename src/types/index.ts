/**
 * Core types for Flow Engine
 */

export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  startNode: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  config?: FlowConfig;
}

export interface FlowNode {
  id: string;
  type: string;
  label: string;
  description: string;
  config?: any;
  position?: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface FlowInstance {
  id: string;
  flowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  input: any;
  context: FlowContext;
  currentNode?: string;
  variables: Record<string, any>;
  memoryUsage: number;
}

export interface FlowContext {
  executionId: string;
  flowId: string;
  nodeId: string;
  variables: Record<string, any>;
  input: any;
  config: any;
  memory: number;
}

export interface FlowResult {
  id: string;
  flowId: string;
  status: 'completed' | 'failed';
  startTime: number;
  endTime: number;
  executionTime: number;
  executionPath: string[];
  results: any[];
  output: Record<string, any>;
  memoryUsage: number;
  performance: FlowPerformance;
}

export interface FlowPerformance {
  nodesExecuted: number;
  memoryPeak: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface FlowConfig {
  timeout?: number;
  retries?: number;
  memoryLimit?: number;
  cacheEnabled?: boolean;
  parallel?: boolean;
}

export interface FlowAPI {
  execute(flowId: string, input: any, context?: Partial<FlowContext>): Promise<FlowResult>;
  register(definition: FlowDefinition): Promise<void>;
  getStatus(executionId: string): Promise<FlowInstance | null>;
  cancel(executionId: string): Promise<boolean>;
  getStatistics(): Promise<FlowStatistics>;
}

export interface FlowStatistics {
  activeFlows: number;
  completedFlows: number;
  failedFlows: number;
  averageExecutionTime: number;
  memoryUsage: number;
  cacheStats: any;
}

export interface FlowServerConfig {
  port: number;
  host: string;
  cors: boolean;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  memory: {
    maxUsage: number;
    threshold: number;
  };
  cache: {
    maxSize: number;
    ttl: number;
  };
}

export interface FlowRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  flowId: string;
  middleware?: string[];
  validation?: any;
}

export interface FlowMiddleware {
  name: string;
  handler: (req: any, res: any, next: any) => void;
}

export interface FlowError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  executionId?: string;
  flowId?: string;
  nodeId?: string;
}

export interface LiveMonitoringData {
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
  timestamp: string;
  uptime: number;
}