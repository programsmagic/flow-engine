import { BaseParser } from './BaseParser';
import { ComponentInfo, UniversalMethod, FrameworkConfig } from '../types';

export class VueParser extends BaseParser {
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
    if (this.fileContent.includes('<template>') || this.fileContent.includes('export default')) {
      return 'component';
    }
    if (this.fileContent.includes('composables') || this.fileContent.includes('use')) {
      return 'hook';
    }
    if (this.fileContent.includes('api') || this.fileContent.includes('fetch')) {
      return 'service';
    }
    return 'component';
  }

  private determineVisibility(name: string, body: string): 'public' | 'private' | 'protected' | 'export' | 'default' {
    if (body.includes('export default')) return 'default';
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
    
    // Vue lifecycle methods
    const lifecyclePatterns = [
      /beforeCreate\s*\([^)]*\)/g,
      /created\s*\([^)]*\)/g,
      /beforeMount\s*\([^)]*\)/g,
      /mounted\s*\([^)]*\)/g,
      /beforeUpdate\s*\([^)]*\)/g,
      /updated\s*\([^)]*\)/g,
      /beforeDestroy\s*\([^)]*\)/g,
      /destroyed\s*\([^)]*\)/g,
      /beforeUnmount\s*\([^)]*\)/g,
      /unmounted\s*\([^)]*\)/g,
      /errorCaptured\s*\([^)]*\)/g
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
      'beforeCreate': 'mount',
      'created': 'mount',
      'beforeMount': 'mount',
      'mounted': 'mount',
      'beforeUpdate': 'update',
      'updated': 'update',
      'beforeDestroy': 'unmount',
      'destroyed': 'unmount',
      'beforeUnmount': 'unmount',
      'unmounted': 'unmount',
      'errorCaptured': 'error'
    };
    
    return lifecycleMap[methodName] || 'custom';
  }

  protected extractValidationRules(body: string): any[] {
    const rules: any[] = [];
    
    // Vue-specific validation patterns
    const validationPatterns = [
      /vee-validate.*rules/g,
      /vuelidate.*validation/g,
      /yup\.object\([^)]*\)/g,
      /joi\.object\([^)]*\)/g,
      /zod\.object\([^)]*\)/g,
      /rules:\s*{([^}]+)}/g,
      /validators:\s*{([^}]+)}/g
    ];
    
    validationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        rules.push({
          field: 'form',
          rules: [match[1] || 'validation'],
          framework: this.framework
        });
      }
    });
    
    return rules;
  }

  protected extractApiCalls(body: string): any[] {
    const apiCalls: any[] = [];
    
    // Vue-specific API patterns
    const apiPatterns = [
      /fetch\s*\([^)]+\)/g,
      /axios\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /this\.\$http\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /this\.\$api\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /useFetch\s*\([^)]+\)/g,
      /useAsyncData\s*\([^)]+\)/g
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
    if (apiCall.includes('$http')) return 'vue-resource';
    if (apiCall.includes('$api')) return 'vue-api';
    if (apiCall.includes('useFetch') || apiCall.includes('useAsyncData')) return 'nuxt';
    if (apiCall.includes('fetch')) return 'fetch';
    return 'unknown';
  }
}
