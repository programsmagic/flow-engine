import * as fs from 'fs-extra';
import * as path from 'path';
import { FrameworkConfig } from '../types';

export class FrameworkDetector {
  private static frameworks: Map<string, FrameworkConfig> = new Map();

  static {
    this.initializeFrameworks();
  }

  private static initializeFrameworks(): void {
    // React
    this.frameworks.set('react', {
      name: 'React',
      language: 'javascript',
      extensions: ['.jsx', '.tsx', '.js', '.ts'],
      patterns: {
        methods: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function))/g,
        classes: /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g,
        imports: /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
        exports: /export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|{([^}]+)})/g,
        decorators: /@(\w+)(?:\([^)]*\))?/g,
        hooks: /use(\w+)(?:\([^)]*\))?/g
      },
      parsers: {
        method: 'ReactMethodParser',
        class: 'ReactComponentParser',
        import: 'ES6ImportParser',
        export: 'ES6ExportParser'
      },
      generators: {
        workflow: 'ReactWorkflowGenerator',
        diagram: 'ReactDiagramGenerator',
        mermaid: 'ReactMermaidGenerator'
      }
    });

    // Vue
    this.frameworks.set('vue', {
      name: 'Vue',
      language: 'javascript',
      extensions: ['.vue', '.js', '.ts'],
      patterns: {
        methods: /(?:methods\s*:\s*{[^}]*(\w+)\s*\([^)]*\)\s*{[^}]*}|function\s+(\w+))/g,
        classes: /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g,
        imports: /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
        exports: /export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|{([^}]+)})/g,
        decorators: /@(\w+)(?:\([^)]*\))?/g,
        hooks: /(?:computed|watch|mounted|created|destroyed|updated)/g
      },
      parsers: {
        method: 'VueMethodParser',
        class: 'VueComponentParser',
        import: 'ES6ImportParser',
        export: 'ES6ExportParser'
      },
      generators: {
        workflow: 'VueWorkflowGenerator',
        diagram: 'VueDiagramGenerator',
        mermaid: 'VueMermaidGenerator'
      }
    });

    // Angular
    this.frameworks.set('angular', {
      name: 'Angular',
      language: 'typescript',
      extensions: ['.ts', '.js'],
      patterns: {
        methods: /(?:@\w+.*\n)?(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/g,
        classes: /(?:@Component|@Injectable|@Directive|@Pipe).*\n(?:export\s+)?class\s+(\w+)/g,
        imports: /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
        exports: /export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|{([^}]+)})/g,
        decorators: /@(\w+)(?:\([^)]*\))?/g,
        hooks: /(?:ngOnInit|ngOnDestroy|ngOnChanges|ngAfterViewInit|ngAfterContentInit)/g
      },
      parsers: {
        method: 'AngularMethodParser',
        class: 'AngularComponentParser',
        import: 'ES6ImportParser',
        export: 'ES6ExportParser'
      },
      generators: {
        workflow: 'AngularWorkflowGenerator',
        diagram: 'AngularDiagramGenerator',
        mermaid: 'AngularMermaidGenerator'
      }
    });

    // Node.js/Express
    this.frameworks.set('nodejs', {
      name: 'Node.js',
      language: 'javascript',
      extensions: ['.js', '.ts', '.mjs'],
      patterns: {
        methods: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)|(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function))/g,
        classes: /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g,
        imports: /(?:import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g,
        exports: /(?:export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|{([^}]+)})|module\.exports\s*=\s*(\w+))/g,
        decorators: /@(\w+)(?:\([^)]*\))?/g,
        hooks: /(?:app\.(?:get|post|put|delete|patch|use)|router\.(?:get|post|put|delete|patch))/g
      },
      parsers: {
        method: 'NodeMethodParser',
        class: 'NodeClassParser',
        import: 'NodeImportParser',
        export: 'NodeExportParser'
      },
      generators: {
        workflow: 'NodeWorkflowGenerator',
        diagram: 'NodeDiagramGenerator',
        mermaid: 'NodeMermaidGenerator'
      }
    });

    // Next.js
    this.frameworks.set('nextjs', {
      name: 'Next.js',
      language: 'javascript',
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      patterns: {
        methods: /(?:export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)|export\s+(?:async\s+)?function\s+(\w+))/g,
        classes: /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g,
        imports: /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
        exports: /export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|{([^}]+)})/g,
        decorators: /@(\w+)(?:\([^)]*\))?/g,
        hooks: /(?:getServerSideProps|getStaticProps|getStaticPaths|useRouter|useEffect|useState)/g
      },
      parsers: {
        method: 'NextMethodParser',
        class: 'NextComponentParser',
        import: 'ES6ImportParser',
        export: 'ES6ExportParser'
      },
      generators: {
        workflow: 'NextWorkflowGenerator',
        diagram: 'NextDiagramGenerator',
        mermaid: 'NextMermaidGenerator'
      }
    });

    // Svelte
    this.frameworks.set('svelte', {
      name: 'Svelte',
      language: 'javascript',
      extensions: ['.svelte', '.js', '.ts'],
      patterns: {
        methods: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)|(\w+)\s*\([^)]*\)\s*{)/g,
        classes: /class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g,
        imports: /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
        exports: /export\s+(?:default\s+)?(?:function\s+(\w+)|const\s+(\w+)|class\s+(\w+)|{([^}]+)})/g,
        decorators: /@(\w+)(?:\([^)]*\))?/g,
        hooks: /(?:onMount|onDestroy|beforeUpdate|afterUpdate|on:(\w+))/g
      },
      parsers: {
        method: 'SvelteMethodParser',
        class: 'SvelteComponentParser',
        import: 'ES6ImportParser',
        export: 'ES6ExportParser'
      },
      generators: {
        workflow: 'SvelteWorkflowGenerator',
        diagram: 'SvelteDiagramGenerator',
        mermaid: 'SvelteMermaidGenerator'
      }
    });
  }

  public static async detectFramework(projectPath: string): Promise<string[]> {
    const detectedFrameworks: string[] = [];
    
    try {
      // Check package.json for dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Framework detection based on dependencies
        if (dependencies.react) detectedFrameworks.push('react');
        if (dependencies.vue || dependencies['@vue/cli-service']) detectedFrameworks.push('vue');
        if (dependencies['@angular/core']) detectedFrameworks.push('angular');
        if (dependencies.next) detectedFrameworks.push('nextjs');
        if (dependencies.svelte) detectedFrameworks.push('svelte');
        if (dependencies.express || dependencies.koa || dependencies.fastify) detectedFrameworks.push('nodejs');
      }

      // Check for framework-specific files
      const frameworkFiles = [
        { framework: 'react', files: ['src/App.jsx', 'src/App.tsx', 'src/index.js', 'src/index.tsx'] },
        { framework: 'vue', files: ['src/App.vue', 'src/main.js', 'src/main.ts'] },
        { framework: 'angular', files: ['src/app/app.component.ts', 'src/main.ts', 'angular.json'] },
        { framework: 'nextjs', files: ['pages', 'app', 'next.config.js', 'next.config.ts'] },
        { framework: 'svelte', files: ['src/App.svelte', 'svelte.config.js'] },
        { framework: 'nodejs', files: ['server.js', 'app.js', 'index.js', 'src/server.ts'] }
      ];

      for (const { framework, files } of frameworkFiles) {
        for (const file of files) {
          if (await fs.pathExists(path.join(projectPath, file))) {
            if (!detectedFrameworks.includes(framework)) {
              detectedFrameworks.push(framework);
            }
          }
        }
      }

      // Check for TypeScript
      if (await fs.pathExists(path.join(projectPath, 'tsconfig.json'))) {
        // TypeScript is detected, but framework is already determined above
      }

    } catch (error) {
      console.warn('Error detecting framework:', error);
    }

    return detectedFrameworks.length > 0 ? detectedFrameworks : ['nodejs']; // Default to Node.js
  }

  public static getFrameworkConfig(framework: string): FrameworkConfig | undefined {
    return this.frameworks.get(framework);
  }

  public static getAllFrameworks(): FrameworkConfig[] {
    return Array.from(this.frameworks.values());
  }

  public static async analyzeProjectStructure(projectPath: string): Promise<{
    frameworks: string[];
    languages: string[];
    structure: Record<string, any>;
  }> {
    const frameworks = await this.detectFramework(projectPath);
    const languages = new Set<string>();
    const structure: Record<string, any> = {};

    // Analyze file structure
    const files = await this.getProjectFiles(projectPath);
    
    for (const file of files) {
      const ext = path.extname(file);
      if (ext === '.ts' || ext === '.tsx') languages.add('typescript');
      if (ext === '.js' || ext === '.jsx') languages.add('javascript');
      if (ext === '.vue') languages.add('vue');
      if (ext === '.svelte') languages.add('svelte');
    }

    // Analyze project structure
    structure.files = files.length;
    structure.directories = await this.getDirectories(projectPath);
    structure.frameworks = frameworks;
    structure.languages = Array.from(languages);

    return {
      frameworks,
      languages: Array.from(languages),
      structure
    };
  }

  private static async getProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(projectPath);
      
      for (const item of items) {
        const fullPath = path.join(projectPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !this.shouldIgnoreDirectory(item)) {
          const subFiles = await this.getProjectFiles(fullPath);
          files.push(...subFiles);
        } else if (stat.isFile() && this.isRelevantFile(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn('Error reading project files:', error);
    }
    
    return files;
  }

  private static async getDirectories(projectPath: string): Promise<string[]> {
    const directories: string[] = [];
    
    try {
      const items = await fs.readdir(projectPath);
      
      for (const item of items) {
        const fullPath = path.join(projectPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !this.shouldIgnoreDirectory(item)) {
          directories.push(fullPath);
          const subDirs = await this.getDirectories(fullPath);
          directories.push(...subDirs);
        }
      }
    } catch (error) {
      console.warn('Error reading directories:', error);
    }
    
    return directories;
  }

  private static shouldIgnoreDirectory(dirName: string): boolean {
    const ignoreDirs = [
      'node_modules', '.git', 'dist', 'build', 'coverage', 
      '.next', '.nuxt', '.vuepress', 'node_modules', 
      '.cache', '.temp', '.tmp', 'vendor'
    ];
    return ignoreDirs.includes(dirName);
  }

  private static isRelevantFile(fileName: string): boolean {
    const relevantExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', 
      '.php', '.py', '.java', '.cs', '.go', '.rs'
    ];
    return relevantExtensions.some(ext => fileName.endsWith(ext));
  }
}
