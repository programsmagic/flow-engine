import { BaseParser } from './BaseParser';
import { ComponentInfo, UniversalMethod, FrameworkConfig } from '../types';

export class NodeParser extends BaseParser {
  public parse(): ComponentInfo {
    const lines = this.fileContent.split('\n');
    
    return {
      name: this.extractClassName(),
      namespace: this.extractNamespace(),
      uses: this.extractImports(),
      methods: this.extractMethods(),
      filePath: this.filePath,
      framework: this.framework,
      language: this.language,
      type: this.determineComponentType()
    };
  }

  protected parseMethod(name: string, body: string): UniversalMethod | null {
    const lines = body.split('\n');
    const lineNumber = this.getLineNumber(body);
    
    return {
      name,
      visibility: this.determineVisibility(name, body),
      parameters: this.extractParameters(body),
      returnType: this.extractReturnType(body),
      body,
      dependencies: this.extractDependencies(body),
      validationRules: this.extractValidationRules(body),
      databaseQueries: this.extractDatabaseQueries(body),
      apiCalls: this.extractApiCalls(body),
      conditions: this.extractConditions(body),
      loops: this.extractLoops(body),
      comments: this.extractComments(body),
      lineNumber,
      endLineNumber: lineNumber + lines.length - 1,
      decorators: this.extractDecorators(body),
      hooks: this.extractHooks(body),
      lifecycle: this.extractLifecycleEvents(body)
    };
  }

  private determineComponentType(): 'component' | 'controller' | 'service' | 'hook' | 'middleware' | 'util' | 'model' {
    if (this.fileContent.includes('app.get') || this.fileContent.includes('app.post') || 
        this.fileContent.includes('router.get') || this.fileContent.includes('router.post')) {
      return 'controller';
    }
    if (this.fileContent.includes('middleware') || this.fileContent.includes('app.use')) {
      return 'middleware';
    }
    if (this.fileContent.includes('model') || this.fileContent.includes('schema')) {
      return 'model';
    }
    if (this.fileContent.includes('service') || this.fileContent.includes('api')) {
      return 'service';
    }
    if (this.fileContent.includes('util') || this.fileContent.includes('helper')) {
      return 'util';
    }
    return 'service';
  }

  private determineVisibility(name: string, body: string): 'public' | 'private' | 'protected' | 'export' | 'default' {
    if (body.includes('module.exports') || body.includes('export default')) return 'default';
    if (body.includes('export')) return 'export';
    if (body.includes('private')) return 'private';
    if (body.includes('protected')) return 'protected';
    return 'public';
  }

  private extractReturnType(body: string): string | undefined {
    const returnTypeMatch = body.match(/:\s*(\w+)/);
    return returnTypeMatch ? returnTypeMatch[1] : undefined;
  }

  private extractLifecycleEvents(body: string): any[] {
    const lifecycleEvents: any[] = [];
    
    // Node.js/Express lifecycle patterns
    const lifecyclePatterns = [
      /app\.listen\s*\([^)]*\)/g,
      /server\.on\s*\([^)]*\)/g,
      /process\.on\s*\([^)]*\)/g,
      /beforeExit|exit|uncaughtException|unhandledRejection/g
    ];
    
    lifecyclePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        const methodName = match[0].split('(')[0];
        lifecycleEvents.push({
          name: methodName,
          type: this.mapLifecycleType(methodName),
          framework: this.framework
        });
      }
    });
    
    return lifecycleEvents;
  }

  private mapLifecycleType(methodName: string): string {
    const lifecycleMap: Record<string, string> = {
      'app.listen': 'start',
      'server.on': 'event',
      'process.on': 'process',
      'beforeExit': 'exit',
      'exit': 'exit',
      'uncaughtException': 'error',
      'unhandledRejection': 'error'
    };
    
    return lifecycleMap[methodName] || 'custom';
  }

  protected extractValidationRules(body: string): any[] {
    const rules: any[] = [];
    
    // Node.js-specific validation patterns
    const validationPatterns = [
      /joi\.object\([^)]*\)/g,
      /yup\.object\([^)]*\)/g,
      /zod\.object\([^)]*\)/g,
      /express-validator.*check/g,
      /validator\.is/g,
      /req\.checkBody/g,
      /req\.assert/g
    ];
    
    validationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        rules.push({
          field: 'request',
          rules: [match[1] || 'validation'],
          framework: this.framework
        });
      }
    });
    
    return rules;
  }

  protected extractApiCalls(body: string): any[] {
    const apiCalls: any[] = [];
    
    // Node.js-specific API patterns
    const apiPatterns = [
      /fetch\s*\([^)]+\)/g,
      /axios\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /request\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /http\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /https\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /got\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /superagent\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g
    ];
    
    apiPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        const method = this.extractHttpMethod(match[0]);
        const url = this.extractUrl(match[0]);
        
        apiCalls.push({
          url: url || 'unknown',
          method,
          framework: this.framework,
          library: this.determineApiLibrary(match[0])
        });
      }
    });
    
    return apiCalls;
  }

  private determineApiLibrary(apiCall: string): string {
    if (apiCall.includes('axios')) return 'axios';
    if (apiCall.includes('request')) return 'request';
    if (apiCall.includes('got')) return 'got';
    if (apiCall.includes('superagent')) return 'superagent';
    if (apiCall.includes('http.') || apiCall.includes('https.')) return 'http';
    if (apiCall.includes('fetch')) return 'fetch';
    return 'unknown';
  }

  protected extractDatabaseQueries(body: string): any[] {
    const queries: any[] = [];
    
    // Node.js-specific database patterns
    const dbPatterns = [
      // Mongoose
      /(\w+)\.(?:find|findOne|findById|create|update|delete|remove|save)\s*\([^)]*\)/g,
      // Sequelize
      /(\w+)\.(?:findAll|findOne|create|update|destroy)\s*\([^)]*\)/g,
      // Prisma
      /prisma\.(\w+)\.(?:findMany|findFirst|create|update|delete)\s*\([^)]*\)/g,
      // Raw SQL
      /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?FROM\s+\w+/gi,
      // Knex
      /knex\s*\([^)]*\)\.(?:select|insert|update|del)\s*\([^)]*\)/g
    ];
    
    dbPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        queries.push({
          type: this.determineQueryType(match[0]),
          table: this.extractTableName(match[0]),
          rawQuery: match[0],
          framework: this.framework,
          orm: this.determineORM(match[0])
        });
      }
    });
    
    return queries;
  }

  private determineORM(query: string): string {
    if (query.includes('mongoose') || query.includes('.find(')) return 'mongoose';
    if (query.includes('sequelize') || query.includes('.findAll(')) return 'sequelize';
    if (query.includes('prisma')) return 'prisma';
    if (query.includes('knex')) return 'knex';
    if (query.includes('SELECT') || query.includes('INSERT')) return 'raw-sql';
    return 'unknown';
  }

  private extractTableName(query: string): string {
    const tableMatch = query.match(/(?:FROM|into|update)\s+(\w+)/i);
    return tableMatch ? tableMatch[1] : 'unknown';
  }
}
