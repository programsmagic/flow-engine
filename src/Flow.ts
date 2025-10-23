import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { WorkflowProcessor } from './core/WorkflowProcessor';
import { AsyncWorkflowEngine } from './core/AsyncWorkflowEngine';
import { FrameworkDetector } from './core/FrameworkDetector';
import { UniversalIntegrator } from './integrations/UniversalIntegrator';
import { WorkflowPatterns } from './patterns/WorkflowPatterns';
import { ParserOptions, WorkflowResult, Workflow, ComponentInfo } from './types';

export interface FlowOptions {
  framework?: string;
  language?: string;
  parallel?: boolean;
  cache?: boolean;
  workers?: number;
  timeout?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

export interface FlowGenerateOptions {
  input: string;
  output: string;
  format?: 'json' | 'yaml' | 'mermaid' | 'all';
  framework?: string;
  language?: string;
  parallel?: boolean;
  cache?: boolean;
  workers?: number;
  optimize?: boolean;
  includeComments?: boolean;
  includeValidation?: boolean;
  includeDatabaseQueries?: boolean;
  includeApiCalls?: boolean;
  generateDiagram?: boolean;
  diagramFormat?: 'png' | 'svg' | 'pdf';
}

export interface FlowAnalyzeOptions {
  input: string;
  framework?: string;
  language?: string;
  verbose?: boolean;
}

export interface FlowDetectOptions {
  input: string;
  verbose?: boolean;
}

export interface FlowOptimizeOptions {
  input: string;
  output: string;
  format?: 'json' | 'yaml' | 'html' | 'all';
}

export interface FlowIntegrateOptions {
  input: string;
  framework: string;
  language: string;
  projectType: 'web' | 'mobile' | 'desktop' | 'api' | 'microservice' | 'library';
  deployment: 'local' | 'docker' | 'kubernetes' | 'serverless' | 'cloud';
  ciCd: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'azure-devops' | 'circleci';
  monitoring: 'prometheus' | 'datadog' | 'newrelic' | 'sentry' | 'custom';
  database: 'mysql' | 'postgresql' | 'mongodb' | 'redis' | 'elasticsearch' | 'none';
  cache: 'redis' | 'memcached' | 'memory' | 'none';
  queue: 'rabbitmq' | 'kafka' | 'sqs' | 'bull' | 'agenda' | 'none';
}

export class Flow extends EventEmitter {
  private processor: WorkflowProcessor;
  private engine: AsyncWorkflowEngine;
  private integrator: UniversalIntegrator;
  private options: FlowOptions;

  constructor(options: FlowOptions = {}) {
    super();
    this.options = {
      framework: 'auto-detect',
      language: 'auto-detect',
      parallel: true,
      cache: true,
      workers: 4,
      timeout: 300000,
      enableMetrics: true,
      enableLogging: true,
      ...options
    };

    this.processor = new WorkflowProcessor();
    this.engine = new AsyncWorkflowEngine({
      maxConcurrency: this.options.workers || 4,
      timeout: this.options.timeout || 300000,
      enableCaching: this.options.cache || true,
      enableMetrics: this.options.enableMetrics || true,
      enableLogging: this.options.enableLogging || true
    });
    this.integrator = new UniversalIntegrator();

    // Register workflow patterns
    this.registerWorkflowPatterns();
  }

  /**
   * Generate workflows from a project
   */
  public async generate(options: FlowGenerateOptions): Promise<WorkflowResult> {
    this.emit('generate:started', { options });

    try {
      const parserOptions: ParserOptions = {
        inputPath: options.input,
        outputPath: options.output,
        format: options.format || 'all',
        includeComments: options.includeComments ?? true,
        includeValidation: options.includeValidation ?? true,
        includeDatabaseQueries: options.includeDatabaseQueries ?? true,
        includeApiCalls: options.includeApiCalls ?? true,
        generateDiagram: options.generateDiagram ?? true,
        diagramFormat: options.diagramFormat || 'png',
        framework: options.framework || this.options.framework,
        language: options.language || this.options.language,
        parallel: options.parallel ?? this.options.parallel,
        cache: options.cache ?? this.options.cache,
        workers: options.workers || this.options.workers,
        optimize: options.optimize || false
      };

      const result = await this.processor.processProject(parserOptions);
      
      this.emit('generate:completed', { result });
      return result;

    } catch (error) {
      this.emit('generate:error', { error });
      throw error;
    }
  }

  /**
   * Analyze a project without generating files
   */
  public async analyze(options: FlowAnalyzeOptions): Promise<any> {
    this.emit('analyze:started', { options });

    try {
      const analysis = await FrameworkDetector.analyzeProjectStructure(options.input);
      
      this.emit('analyze:completed', { analysis });
      return analysis;

    } catch (error) {
      this.emit('analyze:error', { error });
      throw error;
    }
  }

  /**
   * Detect frameworks and languages in a project
   */
  public async detect(options: FlowDetectOptions): Promise<any> {
    this.emit('detect:started', { options });

    try {
      const frameworks = await FrameworkDetector.detectFramework(options.input);
      const analysis = await FrameworkDetector.analyzeProjectStructure(options.input);
      
      const result = {
        frameworks,
        analysis,
        detectedAt: new Date().toISOString()
      };

      this.emit('detect:completed', { result });
      return result;

    } catch (error) {
      this.emit('detect:error', { error });
      throw error;
    }
  }

  /**
   * Optimize a project and get suggestions
   */
  public async optimize(options: FlowOptimizeOptions): Promise<any> {
    this.emit('optimize:started', { options });

    try {
      // First generate workflows to analyze the project
      const generateResult = await this.generate({
        input: options.input,
        output: options.output,
        format: options.format || 'json',
        optimize: true
      });

      // Extract optimization suggestions
      const optimizations = {
        suggestions: this.extractOptimizations(generateResult),
        performance: generateResult.performance,
        statistics: generateResult.statistics,
        generatedAt: new Date().toISOString()
      };

      this.emit('optimize:completed', { optimizations });
      return optimizations;

    } catch (error) {
      this.emit('optimize:error', { error });
      throw error;
    }
  }

  /**
   * Integrate Flow with a project
   */
  public async integrate(options: FlowIntegrateOptions): Promise<any> {
    this.emit('integrate:started', { options });

    try {
      const result = await this.integrator.integrate(options.input, {
        framework: options.framework,
        language: options.language,
        projectType: options.projectType,
        deployment: options.deployment,
        ciCd: options.ciCd,
        monitoring: options.monitoring,
        database: options.database,
        cache: options.cache,
        queue: options.queue
      });

      this.emit('integrate:completed', { result });
      return result;

    } catch (error) {
      this.emit('integrate:error', { error });
      throw error;
    }
  }

  /**
   * Execute workflows asynchronously
   */
  public async executeWorkflow(workflowId: string, input: any = {}): Promise<any> {
    this.emit('workflow:execute:started', { workflowId, input });

    try {
      const result = await this.engine.executeWorkflow(workflowId, input);
      
      this.emit('workflow:execute:completed', { workflowId, result });
      return result;

    } catch (error) {
      this.emit('workflow:execute:error', { workflowId, error });
      throw error;
    }
  }

  /**
   * Execute multiple workflows in parallel
   */
  public async executeWorkflowsParallel(workflowIds: string[], input: any = {}): Promise<any[]> {
    this.emit('workflows:parallel:started', { workflowIds, input });

    try {
      const results = await this.engine.executeWorkflowsParallel(workflowIds, input);
      
      this.emit('workflows:parallel:completed', { workflowIds, results });
      return results;

    } catch (error) {
      this.emit('workflows:parallel:error', { workflowIds, error });
      throw error;
    }
  }

  /**
   * Execute workflows in sequence
   */
  public async executeWorkflowsSequence(workflowIds: string[], input: any = {}): Promise<any[]> {
    this.emit('workflows:sequence:started', { workflowIds, input });

    try {
      const results = await this.engine.executeWorkflowsSequence(workflowIds, input);
      
      this.emit('workflows:sequence:completed', { workflowIds, results });
      return results;

    } catch (error) {
      this.emit('workflows:sequence:error', { workflowIds, error });
      throw error;
    }
  }

  /**
   * Get available workflow patterns
   */
  public getPatterns(framework?: string): Workflow[] {
    if (framework) {
      return WorkflowPatterns.getPatternsByFramework(framework);
    }
    return WorkflowPatterns.getAllPatterns();
  }

  /**
   * Register a custom workflow
   */
  public registerWorkflow(workflow: Workflow): void {
    this.engine.registerWorkflow(workflow);
    this.emit('workflow:registered', { workflow });
  }

  /**
   * Get execution metrics
   */
  public getMetrics(): any {
    return this.engine.getMetrics();
  }

  /**
   * Get execution status
   */
  public getExecutionStatus(executionId: string): any {
    return this.engine.getExecutionStatus(executionId);
  }

  /**
   * Cancel a running execution
   */
  public async cancelExecution(executionId: string): Promise<void> {
    await this.engine.cancelExecution(executionId);
    this.emit('execution:cancelled', { executionId });
  }

  /**
   * Clear all executions
   */
  public clearExecutions(): void {
    this.engine.clearExecutions();
    this.emit('executions:cleared');
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    await this.engine.cleanup();
    this.emit('flow:cleaned');
  }

  private registerWorkflowPatterns(): void {
    const patterns = WorkflowPatterns.getAllPatterns();
    patterns.forEach(pattern => {
      this.engine.registerWorkflow(pattern);
    });
  }

  private extractOptimizations(result: WorkflowResult): any[] {
    const optimizations: any[] = [];

    // Analyze workflows for optimization opportunities
    result.workflows.forEach(workflow => {
      // Check for high complexity
      if (workflow.metadata.complexity === 'high') {
        optimizations.push({
          type: 'complexity',
          message: `Workflow ${workflow.name} has high complexity`,
          suggestion: 'Consider breaking down into smaller workflows',
          severity: 'medium'
        });
      }

      // Check for performance issues
      if (workflow.metadata.performance.cyclomaticComplexity > 10) {
        optimizations.push({
          type: 'performance',
          message: `Workflow ${workflow.name} has high cyclomatic complexity`,
          suggestion: 'Simplify conditional logic',
          severity: 'high'
        });
      }

      // Check for too many dependencies
      if (workflow.metadata.performance.dependencies > 10) {
        optimizations.push({
          type: 'dependencies',
          message: `Workflow ${workflow.name} has many dependencies`,
          suggestion: 'Consider dependency injection or service locator pattern',
          severity: 'medium'
        });
      }
    });

    return optimizations;
  }
}

// Export the main Flow class
export { Flow as default };
