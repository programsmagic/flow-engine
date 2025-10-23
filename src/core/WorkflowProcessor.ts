import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'fast-glob';
import { Worker } from 'worker_threads';
import { 
  ParserOptions, 
  WorkflowResult, 
  ComponentInfo, 
  Workflow,
  TaskCore 
} from '../types';
import { FrameworkDetector } from './FrameworkDetector';
import { ParserTaskCore, GeneratorTaskCore, AnalyzerTaskCore, OptimizerTaskCore } from './TaskCore';

export class WorkflowProcessor {
  private taskCores: Map<string, TaskCore> = new Map();
  private cache: Map<string, any> = new Map();
  private performanceMetrics: {
    startTime: number;
    endTime: number;
    memoryUsage: number;
    cacheHits: number;
    cacheMisses: number;
  } = {
    startTime: 0,
    endTime: 0,
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor() {
    this.initializeTaskCores();
  }

  private initializeTaskCores(): void {
    const frameworks = ['react', 'vue', 'angular', 'nodejs', 'nextjs', 'svelte'];
    const languages = ['javascript', 'typescript'];

    frameworks.forEach(framework => {
      languages.forEach(language => {
        // Parser cores
        const parserCore = new ParserTaskCore(framework, language);
        this.taskCores.set(parserCore.id, parserCore);

        // Generator cores
        const generatorCore = new GeneratorTaskCore(framework, language);
        this.taskCores.set(generatorCore.id, generatorCore);

        // Analyzer cores
        const analyzerCore = new AnalyzerTaskCore(framework, language);
        this.taskCores.set(analyzerCore.id, analyzerCore);

        // Optimizer cores
        const optimizerCore = new OptimizerTaskCore(framework, language);
        this.taskCores.set(optimizerCore.id, optimizerCore);
      });
    });
  }

  public async processProject(options: ParserOptions): Promise<WorkflowResult> {
    this.performanceMetrics.startTime = Date.now();
    this.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed;

    try {
      // Step 1: Detect frameworks and analyze project structure
      const projectAnalysis = await this.analyzeProject(options.inputPath);
      
      // Step 2: Parse components using appropriate parsers
      const components = await this.parseComponents(options, projectAnalysis.frameworks);
      
      // Step 3: Generate workflows using appropriate generators
      const workflows = await this.generateWorkflows(components, options);
      
      // Step 4: Analyze the results
      const analysis = await this.analyzeResults(components, workflows);
      
      // Step 5: Optimize if requested
      const optimizations = options.optimize ? await this.optimizeCode(components) : [];
      
      // Step 6: Generate output files
      await this.generateOutputFiles(workflows, analysis, options);
      
      this.performanceMetrics.endTime = Date.now();
      this.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed - this.performanceMetrics.memoryUsage;

      return {
        workflows,
        statistics: analysis.statistics,
        performance: {
          executionTime: this.performanceMetrics.endTime - this.performanceMetrics.startTime,
          memoryUsage: this.performanceMetrics.memoryUsage,
          cacheHits: this.performanceMetrics.cacheHits,
          cacheMisses: this.performanceMetrics.cacheMisses
        },
        errors: [],
        warnings: []
      };

    } catch (error) {
      this.performanceMetrics.endTime = Date.now();
      return {
        workflows: [],
        statistics: {
          totalComponents: 0,
          totalMethods: 0,
          frameworks: {},
          languages: {},
          complexity: { low: 0, medium: 0, high: 0 }
        },
        performance: {
          executionTime: this.performanceMetrics.endTime - this.performanceMetrics.startTime,
          memoryUsage: this.performanceMetrics.memoryUsage,
          cacheHits: this.performanceMetrics.cacheHits,
          cacheMisses: this.performanceMetrics.cacheMisses
        },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }

  private async analyzeProject(inputPath: string): Promise<{
    frameworks: string[];
    languages: string[];
    structure: any;
  }> {
    console.log('🔍 Analyzing project structure...');
    
    const analysis = await FrameworkDetector.analyzeProjectStructure(inputPath);
    
    console.log(`📊 Detected frameworks: ${analysis.frameworks.join(', ')}`);
    console.log(`📊 Detected languages: ${analysis.languages.join(', ')}`);
    console.log(`📊 Total files: ${analysis.structure.files}`);
    
    return analysis;
  }

  private async parseComponents(options: ParserOptions, frameworks: string[]): Promise<ComponentInfo[]> {
    console.log('📝 Parsing components...');
    
    const components: ComponentInfo[] = [];
    const files = await this.getProjectFiles(options.inputPath, frameworks);
    
    // Group files by framework for parallel processing
    const filesByFramework = this.groupFilesByFramework(files, frameworks);
    
    // Process each framework's files in parallel
    const parsePromises = Object.entries(filesByFramework).map(async ([framework, files]) => {
      const parserCore = this.taskCores.get(`parser-${framework}`);
      if (!parserCore) {
        console.warn(`No parser found for framework: ${framework}`);
        return [];
      }

      const frameworkComponents: ComponentInfo[] = [];
      
      for (const file of files) {
        try {
          const cacheKey = `parse-${file}`;
          let component: ComponentInfo;

          if (options.cache && this.cache.has(cacheKey)) {
            component = this.cache.get(cacheKey);
            this.performanceMetrics.cacheHits++;
          } else {
            const content = await fs.readFile(file, 'utf8');
            component = await parserCore.execute({ filePath: file, content });
            
            if (options.cache) {
              this.cache.set(cacheKey, component);
            }
            this.performanceMetrics.cacheMisses++;
          }

          frameworkComponents.push(component);
        } catch (error) {
          console.warn(`Failed to parse ${file}: ${error}`);
        }
      }

      return frameworkComponents;
    });

    const results = await Promise.all(parsePromises);
    results.forEach(frameworkComponents => {
      components.push(...frameworkComponents);
    });

    console.log(`✅ Parsed ${components.length} components`);
    return components;
  }

  private async generateWorkflows(components: ComponentInfo[], options: ParserOptions): Promise<Workflow[]> {
    console.log('🔄 Generating workflows...');
    
    const workflows: Workflow[] = [];
    
    // Group components by framework for parallel processing
    const componentsByFramework = this.groupComponentsByFramework(components);
    
    const generatePromises = Object.entries(componentsByFramework).map(async ([framework, frameworkComponents]) => {
      const generatorCore = this.taskCores.get(`generator-${framework}`);
      if (!generatorCore) {
        console.warn(`No generator found for framework: ${framework}`);
        return [];
      }

      const frameworkWorkflows: Workflow[] = [];
      
      for (const component of frameworkComponents) {
        try {
          const cacheKey = `generate-${component.filePath}`;
          let componentWorkflows: Workflow[];

          if (options.cache && this.cache.has(cacheKey)) {
            componentWorkflows = this.cache.get(cacheKey);
            this.performanceMetrics.cacheHits++;
          } else {
            componentWorkflows = await generatorCore.execute(component);
            
            if (options.cache) {
              this.cache.set(cacheKey, componentWorkflows);
            }
            this.performanceMetrics.cacheMisses++;
          }

          frameworkWorkflows.push(...componentWorkflows);
        } catch (error) {
          console.warn(`Failed to generate workflows for ${component.name}: ${error}`);
        }
      }

      return frameworkWorkflows;
    });

    const results = await Promise.all(generatePromises);
    results.forEach(frameworkWorkflows => {
      workflows.push(...frameworkWorkflows);
    });

    console.log(`✅ Generated ${workflows.length} workflows`);
    return workflows;
  }

  private async analyzeResults(components: ComponentInfo[], workflows: Workflow[]): Promise<any> {
    console.log('📊 Analyzing results...');
    
    const analyzerCore = this.taskCores.get('analyzer-react'); // Use any analyzer
    if (!analyzerCore) {
      return {
        statistics: {
          totalComponents: components.length,
          totalMethods: components.reduce((sum, comp) => sum + comp.methods.length, 0),
          frameworks: {},
          languages: {},
          complexity: { low: 0, medium: 0, high: 0 }
        }
      };
    }

    return await analyzerCore.execute(components);
  }

  private async optimizeCode(components: ComponentInfo[]): Promise<any[]> {
    console.log('⚡ Optimizing code...');
    
    const optimizerCore = this.taskCores.get('optimizer-react'); // Use any optimizer
    if (!optimizerCore) {
      return [];
    }

    return await optimizerCore.execute(components);
  }

  private async generateOutputFiles(workflows: Workflow[], analysis: any, options: ParserOptions): Promise<void> {
    console.log('📁 Generating output files...');
    
    // Ensure output directory exists
    await fs.ensureDir(options.outputPath);
    
    // Generate different output formats
    if (options.format === 'json' || options.format === 'all') {
      await this.generateJsonOutput(workflows, analysis, options);
    }
    
    if (options.format === 'yaml' || options.format === 'all') {
      await this.generateYamlOutput(workflows, analysis, options);
    }
    
    if (options.format === 'mermaid' || options.format === 'all') {
      await this.generateMermaidOutput(workflows, options);
    }
    
    if (options.generateDiagram) {
      await this.generateDiagrams(workflows, options);
    }
  }

  private async generateJsonOutput(workflows: Workflow[], analysis: any, options: ParserOptions): Promise<void> {
    const output = {
      workflows,
      analysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        framework: 'universal'
      }
    };
    
    await fs.writeJson(path.join(options.outputPath, 'workflows.json'), output, { spaces: 2 });
  }

  private async generateYamlOutput(workflows: Workflow[], analysis: any, options: ParserOptions): Promise<void> {
    const yaml = require('js-yaml');
    const output = {
      workflows,
      analysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        framework: 'universal'
      }
    };
    
    await fs.writeFile(path.join(options.outputPath, 'workflows.yaml'), yaml.dump(output));
  }

  private async generateMermaidOutput(workflows: Workflow[], options: ParserOptions): Promise<void> {
    // Implementation for Mermaid generation
    console.log('🌊 Generating Mermaid diagrams...');
  }

  private async generateDiagrams(workflows: Workflow[], options: ParserOptions): Promise<void> {
    // Implementation for diagram generation
    console.log('📊 Generating visual diagrams...');
  }

  private async getProjectFiles(inputPath: string, frameworks: string[]): Promise<string[]> {
    const extensions: string[] = [];
    
    frameworks.forEach(framework => {
      const config = FrameworkDetector.getFrameworkConfig(framework);
      if (config) {
        extensions.push(...config.extensions);
      }
    });

    const globPattern = `**/*.{${extensions.join(',')}}`;
    return await glob(globPattern, { cwd: inputPath, absolute: true });
  }

  private groupFilesByFramework(files: string[], frameworks: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    
    frameworks.forEach(framework => {
      grouped[framework] = [];
    });

    files.forEach(file => {
      const ext = path.extname(file);
      const config = frameworks
        .map(f => FrameworkDetector.getFrameworkConfig(f))
        .find(c => c?.extensions.includes(ext));
      
      if (config) {
        const framework = frameworks.find(f => FrameworkDetector.getFrameworkConfig(f) === config);
        if (framework) {
          grouped[framework].push(file);
        }
      }
    });

    return grouped;
  }

  private groupComponentsByFramework(components: ComponentInfo[]): Record<string, ComponentInfo[]> {
    const grouped: Record<string, ComponentInfo[]> = {};
    
    components.forEach(component => {
      if (!grouped[component.framework]) {
        grouped[component.framework] = [];
      }
      grouped[component.framework].push(component);
    });

    return grouped;
  }
}
