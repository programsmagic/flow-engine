import { BaseParser } from './BaseParser';
import { ComponentInfo, UniversalMethod, FrameworkConfig } from '../types';

export class ReactParser extends BaseParser {
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
    if (this.fileContent.includes('export default function') || this.fileContent.includes('const') && this.fileContent.includes('= () =>')) {
      return 'component';
    }
    if (this.fileContent.includes('use') && this.fileContent.includes('(')) {
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
    
    // React lifecycle methods
    const lifecyclePatterns = [
      /componentDidMount\s*\([^)]*\)/g,
      /componentDidUpdate\s*\([^)]*\)/g,
      /componentWillUnmount\s*\([^)]*\)/g,
      /componentDidCatch\s*\([^)]*\)/g,
      /getDerivedStateFromProps\s*\([^)]*\)/g,
      /getSnapshotBeforeUpdate\s*\([^)]*\)/g
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
      'componentDidMount': 'mount',
      'componentDidUpdate': 'update',
      'componentWillUnmount': 'unmount',
      'componentDidCatch': 'error',
      'getDerivedStateFromProps': 'update',
      'getSnapshotBeforeUpdate': 'update'
    };
    
    return lifecycleMap[methodName] || 'custom';
  }

  protected extractValidationRules(body: string): any[] {
    const rules: any[] = [];
    
    // React-specific validation patterns
    const validationPatterns = [
      /yup\.object\([^)]*\)/g,
      /joi\.object\([^)]*\)/g,
      /zod\.object\([^)]*\)/g,
      /formik\.validationSchema/g,
      /react-hook-form.*validation/g,
      /propTypes\s*=\s*{([^}]+)}/g
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
    
    // React-specific API patterns
    const apiPatterns = [
      /fetch\s*\([^)]+\)/g,
      /axios\.(?:get|post|put|delete|patch)\s*\([^)]+\)/g,
      /useQuery\s*\([^)]+\)/g,
      /useMutation\s*\([^)]+\)/g,
      /useSWR\s*\([^)]+\)/g,
      /react-query.*query/g
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
    if (apiCall.includes('useQuery') || apiCall.includes('useMutation')) return 'react-query';
    if (apiCall.includes('useSWR')) return 'swr';
    if (apiCall.includes('fetch')) return 'fetch';
    return 'unknown';
  }
}
