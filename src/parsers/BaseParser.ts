import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentInfo, UniversalMethod, FrameworkConfig } from '../types';

export abstract class BaseParser {
  protected fileContent: string;
  protected filePath: string;
  protected framework: string;
  protected language: string;
  protected config: FrameworkConfig;

  constructor(filePath: string, framework: string, config: FrameworkConfig) {
    this.filePath = filePath;
    this.framework = framework;
    this.config = config;
    this.language = config.language;
    this.fileContent = fs.readFileSync(filePath, 'utf8');
  }

  public abstract parse(): ComponentInfo;

  protected extractClassName(): string {
    const classMatch = this.fileContent.match(this.config.patterns.classes);
    return classMatch ? classMatch[1] : this.extractFileName();
  }

  protected extractFileName(): string {
    return path.basename(this.filePath, path.extname(this.filePath));
  }

  protected extractNamespace(): string {
    // Default implementation - can be overridden by specific parsers
    const namespaceMatch = this.fileContent.match(/namespace\s+([^;]+);/);
    return namespaceMatch ? namespaceMatch[1].trim() : '';
  }

  protected extractImports(): string[] {
    const imports: string[] = [];
    const importMatches = this.fileContent.match(this.config.patterns.imports);
    
    if (importMatches) {
      importMatches.forEach(match => {
        const cleanMatch = match.replace(/import\s+/, '').replace(/from\s+/, '').replace(/['"]/g, '').trim();
        imports.push(cleanMatch);
      });
    }
    
    return imports;
  }

  protected extractExports(): string[] {
    const exports: string[] = [];
    const exportMatches = this.fileContent.match(this.config.patterns.exports);
    
    if (exportMatches) {
      exportMatches.forEach(match => {
        const cleanMatch = match.replace(/export\s+(?:default\s+)?/, '').trim();
        exports.push(cleanMatch);
      });
    }
    
    return exports;
  }

  protected extractMethods(): UniversalMethod[] {
    const methods: UniversalMethod[] = [];
    const methodRegex = this.config.patterns.methods;
    let match;

    while ((match = methodRegex.exec(this.fileContent)) !== null) {
      const methodName = match[1] || match[2] || match[3];
      const startIndex = match.index;
      
      if (methodName) {
        const methodBody = this.extractMethodBody(startIndex);
        const methodInfo = this.parseMethod(methodName, methodBody);
        
        if (methodInfo) {
          methods.push(methodInfo);
        }
      }
    }

    return methods;
  }

  protected extractMethodBody(startIndex: number): string {
    let braceCount = 0;
    let start = startIndex;
    let end = startIndex;
    let inString = false;
    let stringChar = '';
    let inTemplate = false;

    for (let i = startIndex; i < this.fileContent.length; i++) {
      const char = this.fileContent[i];
      const nextChar = this.fileContent[i + 1];
      
      // Handle template literals
      if (!inString && char === '`') {
        inTemplate = !inTemplate;
      }
      
      // Handle strings
      if (!inTemplate && !inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && this.fileContent[i - 1] !== '\\') {
        inString = false;
      } else if (!inString && !inTemplate) {
        if (char === '{') {
          if (braceCount === 0) start = i;
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            end = i;
            break;
          }
        }
      }
    }

    return this.fileContent.substring(start, end + 1);
  }

  protected abstract parseMethod(name: string, body: string): UniversalMethod | null;

  protected extractParameters(body: string): any[] {
    // Default implementation - can be overridden
    const parameters: any[] = [];
    const paramRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function)|(\w+)\s*:\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function))\s*\(([^)]*)\)/;
    const match = body.match(paramRegex);
    
    if (match && match[2]) {
      const paramString = match[2];
      const params = paramString.split(',').map(p => p.trim());
      
      params.forEach(param => {
        const parts = param.split('=');
        const name = parts[0].trim();
        const defaultValue = parts[1] ? parts[1].trim() : undefined;
        const isRequired = !defaultValue;
        
        parameters.push({
          name,
          defaultValue,
          isRequired
        });
      });
    }
    
    return parameters;
  }

  protected extractDependencies(body: string): string[] {
    const dependencies: string[] = [];
    const importRegex = /(?:import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
    let match;
    
    while ((match = importRegex.exec(body)) !== null) {
      const dep = match[1] || match[2];
      if (dep) dependencies.push(dep);
    }
    
    return dependencies;
  }

  protected extractValidationRules(body: string): any[] {
    // Framework-specific validation extraction
    const rules: any[] = [];
    
    // Generic validation patterns
    const validationPatterns = [
      /(?:validate|validation)\.(?:make|rules?)\s*\([^,]+,\s*\[([^\]]+)\]/g,
      /(?:yup|joi|zod)\.(?:object|schema)\([^)]*\)/g,
      /(?:isValid|validate)\s*\([^)]+\)/g
    ];
    
    validationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        rules.push({
          field: 'unknown',
          rules: [match[1] || 'validation'],
          framework: this.framework
        });
      }
    });
    
    return rules;
  }

  protected extractDatabaseQueries(body: string): any[] {
    const queries: any[] = [];
    
    // Generic database patterns
    const dbPatterns = [
      /(\w+)\.(?:find|findOne|findMany|create|update|delete|remove|save)\s*\([^)]*\)/g,
      /(?:db|database)\.(?:query|execute)\s*\([^)]+\)/g,
      /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?FROM\s+\w+/gi
    ];
    
    dbPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        queries.push({
          type: this.determineQueryType(match[0]),
          table: 'unknown',
          rawQuery: match[0],
          framework: this.framework
        });
      }
    });
    
    return queries;
  }

  protected extractApiCalls(body: string): any[] {
    const apiCalls: any[] = [];
    
    // Generic API patterns
    const apiPatterns = [
      /(?:fetch|axios|request)\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /(?:http|https)\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /(?:api|client)\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g
    ];
    
    apiPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        const method = this.extractHttpMethod(match[0]);
        const url = this.extractUrl(match[0]);
        
        apiCalls.push({
          url: url || 'unknown',
          method,
          framework: this.framework
        });
      }
    });
    
    return apiCalls;
  }

  protected extractConditions(body: string): any[] {
    const conditions: any[] = [];
    
    const conditionPatterns = [
      /if\s*\(([^)]+)\)/g,
      /else\s+if\s*\(([^)]+)\)/g,
      /switch\s*\(([^)]+)\)/g,
      /case\s+([^:]+):/g,
      /(\w+)\s*\?\s*[^:]+\s*:\s*[^;]+/g
    ];
    
    conditionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        conditions.push({
          type: this.determineConditionType(match[0]),
          condition: match[1]?.trim() || match[0].trim(),
          framework: this.framework
        });
      }
    });
    
    return conditions;
  }

  protected extractLoops(body: string): any[] {
    const loops: any[] = [];
    
    const loopPatterns = [
      /for\s*\([^)]+\)/g,
      /while\s*\(([^)]+)\)/g,
      /do\s*\{[^}]*\}\s*while\s*\(([^)]+)\)/g,
      /\.(?:map|filter|reduce|forEach)\s*\([^)]*\)/g
    ];
    
    loopPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        loops.push({
          type: this.determineLoopType(match[0]),
          condition: match[1]?.trim() || match[0].trim(),
          framework: this.framework
        });
      }
    });
    
    return loops;
  }

  protected extractComments(body: string): string[] {
    const comments: string[] = [];
    const commentRegex = /\/\/(.+)$/gm;
    let match;
    
    while ((match = commentRegex.exec(body)) !== null) {
      comments.push(match[1].trim());
    }
    
    return comments;
  }

  protected extractDecorators(body: string): any[] {
    const decorators: any[] = [];
    const decoratorRegex = this.config.patterns.decorators;
    let match;
    
    while ((match = decoratorRegex.exec(body)) !== null) {
      decorators.push({
        name: match[1],
        framework: this.framework
      });
    }
    
    return decorators;
  }

  protected extractHooks(body: string): any[] {
    const hooks: any[] = [];
    const hookRegex = this.config.patterns.hooks;
    let match;
    
    while ((match = hookRegex.exec(body)) !== null) {
      hooks.push({
        name: match[1] || match[0],
        type: this.determineHookType(match[1] || match[0]),
        framework: this.framework
      });
    }
    
    return hooks;
  }

  protected getLineNumber(substring: string): number {
    const beforeSubstring = this.fileContent.substring(0, this.fileContent.indexOf(substring));
    return beforeSubstring.split('\n').length;
  }

  // Helper methods
  private determineQueryType(query: string): string {
    if (query.includes('SELECT') || query.includes('find')) return 'select';
    if (query.includes('INSERT') || query.includes('create')) return 'insert';
    if (query.includes('UPDATE') || query.includes('update')) return 'update';
    if (query.includes('DELETE') || query.includes('delete')) return 'delete';
    return 'raw';
  }

  private extractHttpMethod(call: string): string {
    const methodMatch = call.match(/\.(get|post|put|delete|patch|head|options)\s*\(/i);
    return methodMatch ? methodMatch[1].toUpperCase() : 'GET';
  }

  private extractUrl(call: string): string {
    const urlMatch = call.match(/\(['"`]([^'"`]+)['"`]/);
    return urlMatch ? urlMatch[1] : '';
  }

  private determineConditionType(condition: string): string {
    if (condition.startsWith('if')) return 'if';
    if (condition.startsWith('else if')) return 'elseif';
    if (condition.startsWith('else')) return 'else';
    if (condition.startsWith('switch')) return 'switch';
    if (condition.startsWith('case')) return 'case';
    if (condition.includes('?')) return 'ternary';
    return 'if';
  }

  private determineLoopType(loop: string): string {
    if (loop.startsWith('for')) return 'for';
    if (loop.startsWith('while')) return 'while';
    if (loop.startsWith('do')) return 'do-while';
    if (loop.includes('.map')) return 'map';
    if (loop.includes('.filter')) return 'filter';
    if (loop.includes('.reduce')) return 'reduce';
    if (loop.includes('.forEach')) return 'foreach';
    return 'for';
  }

  private determineHookType(hook: string): string {
    if (hook.startsWith('use')) return 'react-hook';
    if (['mounted', 'created', 'destroyed', 'updated'].includes(hook)) return 'vue-lifecycle';
    if (['ngOnInit', 'ngOnDestroy', 'ngOnChanges'].includes(hook)) return 'angular-lifecycle';
    if (['onMount', 'onDestroy', 'beforeUpdate', 'afterUpdate'].includes(hook)) return 'svelte-lifecycle';
    return 'custom';
  }
}
