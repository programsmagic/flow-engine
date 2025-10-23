// Universal types for any framework/language

export interface UniversalMethod {
  name: string;
  visibility: 'public' | 'private' | 'protected' | 'export' | 'default';
  parameters: MethodParameter[];
  returnType?: string;
  body: string;
  dependencies: string[];
  validationRules: ValidationRule[];
  databaseQueries: DatabaseQuery[];
  apiCalls: ApiCall[];
  conditions: Condition[];
  loops: Loop[];
  comments: string[];
  lineNumber: number;
  endLineNumber: number;
  decorators: Decorator[];
  hooks: Hook[];
  lifecycle: LifecycleEvent[];
}

export interface MethodParameter {
  name: string;
  type?: string;
  defaultValue?: string;
  isRequired: boolean;
  isOptional?: boolean;
  isRest?: boolean;
  isDestructured?: boolean;
}

export interface ValidationRule {
  field: string;
  rules: string[];
  message?: string;
  framework: string;
}

export interface DatabaseQuery {
  type: 'select' | 'insert' | 'update' | 'delete' | 'raw' | 'aggregate';
  table: string;
  conditions?: string[];
  fields?: string[];
  rawQuery?: string;
  framework: string;
  orm?: string;
}

export interface ApiCall {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  framework: string;
  library?: string;
}

export interface Condition {
  type: 'if' | 'elseif' | 'else' | 'switch' | 'case' | 'ternary';
  condition: string;
  nestedConditions?: Condition[];
  framework: string;
}

export interface Loop {
  type: 'for' | 'foreach' | 'while' | 'do-while' | 'map' | 'filter' | 'reduce';
  condition: string;
  variable?: string;
  framework: string;
}

export interface Decorator {
  name: string;
  parameters?: any[];
  framework: string;
}

export interface Hook {
  name: string;
  type: 'useEffect' | 'useState' | 'useCallback' | 'useMemo' | 'useRef' | 'custom';
  dependencies?: string[];
  framework: string;
}

export interface LifecycleEvent {
  name: string;
  type: 'mount' | 'unmount' | 'update' | 'error' | 'custom';
  framework: string;
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'database' | 'api' | 'validation' | 'loop' | 'condition' | 'hook' | 'lifecycle' | 'decorator';
  label: string;
  description?: string;
  data?: any;
  position?: { x: number; y: number };
  framework?: string;
  category?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  type?: 'success' | 'error' | 'conditional' | 'default' | 'async' | 'sync';
  framework?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  component: string;
  method: string;
  framework: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    tags: string[];
    framework: string;
    language: string;
    complexity: 'low' | 'medium' | 'high';
    performance: PerformanceMetrics;
  };
}

export interface PerformanceMetrics {
  cyclomaticComplexity: number;
  linesOfCode: number;
  dependencies: number;
  apiCalls: number;
  databaseQueries: number;
  estimatedExecutionTime?: string;
}

export interface ParserOptions {
  inputPath: string;
  outputPath: string;
  format: 'json' | 'yaml' | 'mermaid' | 'all';
  includeComments: boolean;
  includeValidation: boolean;
  includeDatabaseQueries: boolean;
  includeApiCalls: boolean;
  generateDiagram: boolean;
  diagramFormat: 'png' | 'svg' | 'pdf';
  framework?: string;
  language?: string;
  parallel: boolean;
  cache: boolean;
  workers?: number;
}

export interface ComponentInfo {
  name: string;
  namespace?: string;
  extends?: string;
  implements?: string[];
  uses: string[];
  traits?: string[];
  methods: UniversalMethod[];
  filePath: string;
  framework: string;
  language: string;
  type: 'component' | 'controller' | 'service' | 'hook' | 'middleware' | 'util' | 'model';
}

export interface FrameworkConfig {
  name: string;
  language: string;
  extensions: string[];
  patterns: {
    methods: RegExp;
    classes: RegExp;
    imports: RegExp;
    exports: RegExp;
    decorators: RegExp;
    hooks: RegExp;
  };
  parsers: {
    method: string;
    class: string;
    import: string;
    export: string;
  };
  generators: {
    workflow: string;
    diagram: string;
    mermaid: string;
  };
}

export interface TaskCore {
  id: string;
  name: string;
  type: 'parser' | 'generator' | 'analyzer' | 'optimizer';
  framework: string;
  language: string;
  execute: (input: any, options?: any) => Promise<any>;
  dependencies?: string[];
  priority: number;
  cache?: boolean;
  parallel?: boolean;
}

export interface WorkflowResult {
  workflows: Workflow[];
  statistics: {
    totalComponents: number;
    totalMethods: number;
    frameworks: Record<string, number>;
    languages: Record<string, number>;
    complexity: {
      low: number;
      medium: number;
      high: number;
    };
  };
  performance: {
    executionTime: number;
    memoryUsage: number;
    cacheHits: number;
    cacheMisses: number;
  };
  errors: string[];
  warnings: string[];
}
