import { TaskCore as ITaskCore, WorkflowResult, ComponentInfo, ParserOptions } from '../types';

export abstract class TaskCore implements ITaskCore {
  public id: string;
  public name: string;
  public type: 'parser' | 'generator' | 'analyzer' | 'optimizer';
  public framework: string;
  public language: string;
  public dependencies?: string[];
  public priority: number;
  public cache?: boolean;
  public parallel?: boolean;

  constructor(
    id: string,
    name: string,
    type: 'parser' | 'generator' | 'analyzer' | 'optimizer',
    framework: string,
    language: string,
    options: {
      dependencies?: string[];
      priority?: number;
      cache?: boolean;
      parallel?: boolean;
    } = {}
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.framework = framework;
    this.language = language;
    this.dependencies = options.dependencies;
    this.priority = options.priority || 1;
    this.cache = options.cache || false;
    this.parallel = options.parallel || false;
  }

  public abstract execute(input: any, options?: any): Promise<any>;

  protected validateInput(input: any): boolean {
    return input !== null && input !== undefined;
  }

  protected createError(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.id}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}

export class ParserTaskCore extends TaskCore {
  constructor(framework: string, language: string) {
    super(
      `parser-${framework}`,
      `${framework} Parser`,
      'parser',
      framework,
      language,
      {
        priority: 1,
        cache: true,
        parallel: true
      }
    );
  }

  public async execute(input: { filePath: string; content: string }, options?: any): Promise<ComponentInfo> {
    if (!this.validateInput(input)) {
      throw this.createError('Invalid input provided to parser', 'INVALID_INPUT');
    }

    try {
      this.log(`Parsing ${input.filePath}`);
      
      // Import the appropriate parser dynamically
      const ParserClass = await this.getParserClass();
      const parser = new ParserClass(input.filePath, this.framework, options?.config);
      
      const result = parser.parse();
      
      this.log(`Successfully parsed ${input.filePath}`);
      return result;
    } catch (error) {
      this.log(`Error parsing ${input.filePath}: ${error}`, 'error');
      throw error;
    }
  }

  private async getParserClass(): Promise<any> {
    const parserMap: Record<string, string> = {
      'react': './parsers/ReactParser',
      'vue': './parsers/VueParser',
      'angular': './parsers/AngularParser',
      'nodejs': './parsers/NodeParser',
      'nextjs': './parsers/NextParser',
      'svelte': './parsers/SvelteParser'
    };

    const parserPath = parserMap[this.framework];
    if (!parserPath) {
      throw this.createError(`No parser found for framework: ${this.framework}`, 'PARSER_NOT_FOUND');
    }

    try {
      const module = await import(parserPath);
      return module[`${this.framework.charAt(0).toUpperCase() + this.framework.slice(1)}Parser`];
    } catch (error) {
      throw this.createError(`Failed to load parser for ${this.framework}: ${error}`, 'PARSER_LOAD_ERROR');
    }
  }
}

export class GeneratorTaskCore extends TaskCore {
  constructor(framework: string, language: string) {
    super(
      `generator-${framework}`,
      `${framework} Workflow Generator`,
      'generator',
      framework,
      language,
      {
        priority: 2,
        cache: true,
        parallel: true
      }
    );
  }

  public async execute(input: ComponentInfo, options?: any): Promise<any> {
    if (!this.validateInput(input)) {
      throw this.createError('Invalid input provided to generator', 'INVALID_INPUT');
    }

    try {
      this.log(`Generating workflow for ${input.name}`);
      
      // Import the appropriate generator dynamically
      const GeneratorClass = await this.getGeneratorClass();
      const generator = new GeneratorClass();
      
      const workflows = [];
      for (const method of input.methods) {
        const workflow = generator.generateWorkflow(input.name, method);
        workflows.push(workflow);
      }
      
      this.log(`Successfully generated ${workflows.length} workflows for ${input.name}`);
      return workflows;
    } catch (error) {
      this.log(`Error generating workflows for ${input.name}: ${error}`, 'error');
      throw error;
    }
  }

  private async getGeneratorClass(): Promise<any> {
    const generatorMap: Record<string, string> = {
      'react': './generators/ReactWorkflowGenerator',
      'vue': './generators/VueWorkflowGenerator',
      'angular': './generators/AngularWorkflowGenerator',
      'nodejs': './generators/NodeWorkflowGenerator',
      'nextjs': './generators/NextWorkflowGenerator',
      'svelte': './generators/SvelteWorkflowGenerator'
    };

    const generatorPath = generatorMap[this.framework];
    if (!generatorPath) {
      throw this.createError(`No generator found for framework: ${this.framework}`, 'GENERATOR_NOT_FOUND');
    }

    try {
      const module = await import(generatorPath);
      return module[`${this.framework.charAt(0).toUpperCase() + this.framework.slice(1)}WorkflowGenerator`];
    } catch (error) {
      throw this.createError(`Failed to load generator for ${this.framework}: ${error}`, 'GENERATOR_LOAD_ERROR');
    }
  }
}

export class AnalyzerTaskCore extends TaskCore {
  constructor(framework: string, language: string) {
    super(
      `analyzer-${framework}`,
      `${framework} Code Analyzer`,
      'analyzer',
      framework,
      language,
      {
        priority: 3,
        cache: true,
        parallel: false
      }
    );
  }

  public async execute(input: ComponentInfo[], options?: any): Promise<any> {
    if (!this.validateInput(input)) {
      throw this.createError('Invalid input provided to analyzer', 'INVALID_INPUT');
    }

    try {
      this.log(`Analyzing ${input.length} components`);
      
      const analysis = {
        totalComponents: input.length,
        totalMethods: input.reduce((sum, comp) => sum + comp.methods.length, 0),
        frameworks: this.analyzeFrameworks(input),
        languages: this.analyzeLanguages(input),
        complexity: this.analyzeComplexity(input),
        performance: this.analyzePerformance(input),
        issues: this.findIssues(input)
      };
      
      this.log(`Analysis complete for ${input.length} components`);
      return analysis;
    } catch (error) {
      this.log(`Error analyzing components: ${error}`, 'error');
      throw error;
    }
  }

  private analyzeFrameworks(components: ComponentInfo[]): Record<string, number> {
    const frameworks: Record<string, number> = {};
    components.forEach(comp => {
      frameworks[comp.framework] = (frameworks[comp.framework] || 0) + 1;
    });
    return frameworks;
  }

  private analyzeLanguages(components: ComponentInfo[]): Record<string, number> {
    const languages: Record<string, number> = {};
    components.forEach(comp => {
      languages[comp.language] = (languages[comp.language] || 0) + 1;
    });
    return languages;
  }

  private analyzeComplexity(components: ComponentInfo[]): { low: number; medium: number; high: number } {
    const complexity = { low: 0, medium: 0, high: 0 };
    
    components.forEach(comp => {
      comp.methods.forEach(method => {
        const methodComplexity = this.calculateMethodComplexity(method);
        if (methodComplexity <= 5) complexity.low++;
        else if (methodComplexity <= 15) complexity.medium++;
        else complexity.high++;
      });
    });
    
    return complexity;
  }

  private calculateMethodComplexity(method: any): number {
    let complexity = 1; // Base complexity
    complexity += method.conditions.length;
    complexity += method.loops.length;
    complexity += method.apiCalls.length;
    complexity += method.databaseQueries.length;
    return complexity;
  }

  private analyzePerformance(components: ComponentInfo[]): any {
    return {
      totalApiCalls: components.reduce((sum, comp) => 
        sum + comp.methods.reduce((methodSum, method) => methodSum + method.apiCalls.length, 0), 0),
      totalDatabaseQueries: components.reduce((sum, comp) => 
        sum + comp.methods.reduce((methodSum, method) => methodSum + method.databaseQueries.length, 0), 0),
      averageMethodLength: this.calculateAverageMethodLength(components)
    };
  }

  private calculateAverageMethodLength(components: ComponentInfo[]): number {
    const totalMethods = components.reduce((sum, comp) => sum + comp.methods.length, 0);
    if (totalMethods === 0) return 0;
    
    const totalLines = components.reduce((sum, comp) => 
      sum + comp.methods.reduce((methodSum, method) => 
        methodSum + (method.endLineNumber - method.lineNumber + 1), 0), 0);
    
    return Math.round(totalLines / totalMethods);
  }

  private findIssues(components: ComponentInfo[]): string[] {
    const issues: string[] = [];
    
    components.forEach(comp => {
      comp.methods.forEach(method => {
        if (method.apiCalls.length > 5) {
          issues.push(`Method ${method.name} has too many API calls (${method.apiCalls.length})`);
        }
        if (method.databaseQueries.length > 3) {
          issues.push(`Method ${method.name} has too many database queries (${method.databaseQueries.length})`);
        }
        if (method.conditions.length > 10) {
          issues.push(`Method ${method.name} has high cyclomatic complexity (${method.conditions.length})`);
        }
      });
    });
    
    return issues;
  }
}

export class OptimizerTaskCore extends TaskCore {
  constructor(framework: string, language: string) {
    super(
      `optimizer-${framework}`,
      `${framework} Code Optimizer`,
      'optimizer',
      framework,
      language,
      {
        priority: 4,
        cache: false,
        parallel: false
      }
    );
  }

  public async execute(input: ComponentInfo[], options?: any): Promise<any> {
    if (!this.validateInput(input)) {
      throw this.createError('Invalid input provided to optimizer', 'INVALID_INPUT');
    }

    try {
      this.log(`Optimizing ${input.length} components`);
      
      const optimizations = [];
      
      for (const component of input) {
        const componentOptimizations = this.optimizeComponent(component);
        if (componentOptimizations.length > 0) {
          optimizations.push({
            component: component.name,
            optimizations: componentOptimizations
          });
        }
      }
      
      this.log(`Optimization complete for ${input.length} components`);
      return optimizations;
    } catch (error) {
      this.log(`Error optimizing components: ${error}`, 'error');
      throw error;
    }
  }

  private optimizeComponent(component: ComponentInfo): string[] {
    const optimizations: string[] = [];
    
    // Check for duplicate API calls
    const apiCalls = component.methods.flatMap(method => method.apiCalls);
    const duplicateApiCalls = this.findDuplicateApiCalls(apiCalls);
    if (duplicateApiCalls.length > 0) {
      optimizations.push(`Consider caching or consolidating ${duplicateApiCalls.length} duplicate API calls`);
    }
    
    // Check for inefficient database queries
    const dbQueries = component.methods.flatMap(method => method.databaseQueries);
    const inefficientQueries = this.findInefficientQueries(dbQueries);
    if (inefficientQueries.length > 0) {
      optimizations.push(`Consider optimizing ${inefficientQueries.length} database queries`);
    }
    
    // Check for complex methods
    const complexMethods = component.methods.filter(method => 
      this.calculateMethodComplexity(method) > 10
    );
    if (complexMethods.length > 0) {
      optimizations.push(`Consider refactoring ${complexMethods.length} complex methods`);
    }
    
    return optimizations;
  }

  private findDuplicateApiCalls(apiCalls: any[]): any[] {
    const seen = new Map<string, any[]>();
    const duplicates: any[] = [];
    
    apiCalls.forEach(call => {
      const key = `${call.method}-${call.url}`;
      if (seen.has(key)) {
        seen.get(key)!.push(call);
      } else {
        seen.set(key, [call]);
      }
    });
    
    seen.forEach(calls => {
      if (calls.length > 1) {
        duplicates.push(...calls);
      }
    });
    
    return duplicates;
  }

  private findInefficientQueries(queries: any[]): any[] {
    return queries.filter(query => 
      query.type === 'select' && 
      (!query.fields || query.fields.length === 0)
    );
  }

  private calculateMethodComplexity(method: any): number {
    let complexity = 1;
    complexity += method.conditions.length;
    complexity += method.loops.length;
    complexity += method.apiCalls.length;
    complexity += method.databaseQueries.length;
    return complexity;
  }
}
