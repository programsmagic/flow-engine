import { FlowNode, FlowContext } from '../types';

/**
 * TaskExecutor - Efficiently executes flow nodes with optimized resource usage
 */
export class TaskExecutor {
  private nodeHandlers: Map<string, (context: FlowContext) => Promise<any>> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Execute a flow node
   */
  async execute(node: FlowNode, context: FlowContext): Promise<any> {
    const startTime = Date.now();
    
    try {
      const handler = this.nodeHandlers.get(node.type);
      if (!handler) {
        throw new Error(`No handler found for node type: ${node.type}`);
      }

      const result = await handler(context);
      const executionTime = Date.now() - startTime;

      return {
        output: result,
        executionTime,
        memoryUsage: this.estimateMemoryUsage(node, result)
      };

    } catch (error) {
      throw new Error(`Node execution failed: ${node.id} - ${error.message}`);
    }
  }

  /**
   * Register custom node handler
   */
  registerHandler(nodeType: string, handler: (context: FlowContext) => Promise<any>): void {
    this.nodeHandlers.set(nodeType, handler);
  }

  /**
   * Register default handlers for common node types
   */
  private registerDefaultHandlers(): void {
    // API Call Handler
    this.nodeHandlers.set('api_call', async (context) => {
      const { config, variables } = context;
      const { method = 'GET', url, headers = {}, body } = config;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined
      });

      return await response.json();
    });

    // Database Query Handler
    this.nodeHandlers.set('database_query', async (context) => {
      const { config, variables } = context;
      const { query, params = [] } = config;
      
      // This would integrate with your actual database
      // For now, return mock data
      return { query, params, result: 'mock_data' };
    });

    // Validation Handler
    this.nodeHandlers.set('validation', async (context) => {
      const { config, variables } = context;
      const { rules } = config;
      
      const errors: string[] = [];
      for (const rule of rules) {
        if (!this.validateRule(rule, variables)) {
          errors.push(rule.message);
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    });

    // Data Transformation Handler
    this.nodeHandlers.set('transform', async (context) => {
      const { config, variables } = context;
      const { mapping } = config;
      
      const result: any = {};
      for (const [key, value] of Object.entries(mapping)) {
        if (typeof value === 'string' && value.startsWith('$')) {
          // Variable reference
          const varName = value.substring(1);
          result[key] = variables[varName];
        } else {
          result[key] = value;
        }
      }

      return result;
    });

    // Conditional Logic Handler
    this.nodeHandlers.set('condition', async (context) => {
      const { config, variables } = context;
      const { condition, trueValue, falseValue } = config;
      
      const result = this.evaluateCondition(condition, variables);
      return result ? trueValue : falseValue;
    });

    // External Service Handler
    this.nodeHandlers.set('external_service', async (context) => {
      const { config, variables } = context;
      const { service, action, params = {} } = config;
      
      // This would integrate with actual external services
      return { service, action, params, result: 'service_response' };
    });

    // Email Handler
    this.nodeHandlers.set('email', async (context) => {
      const { config, variables } = context;
      const { to, subject, template, data } = config;
      
      // This would integrate with email service
      return { to, subject, template, data, sent: true };
    });

    // File Processing Handler
    this.nodeHandlers.set('file_processing', async (context) => {
      const { config, variables } = context;
      const { operation, filePath, options = {} } = config;
      
      // This would handle file operations
      return { operation, filePath, options, processed: true };
    });

    // Notification Handler
    this.nodeHandlers.set('notification', async (context) => {
      const { config, variables } = context;
      const { type, message, recipients } = config;
      
      // This would send notifications
      return { type, message, recipients, sent: true };
    });

    // Wait/Delay Handler
    this.nodeHandlers.set('wait', async (context) => {
      const { config } = context;
      const { duration } = config;
      
      await new Promise(resolve => setTimeout(resolve, duration));
      return { waited: duration };
    });
  }

  /**
   * Validate a single rule
   */
  private validateRule(rule: any, variables: any): boolean {
    const { field, operator, value } = rule;
    const fieldValue = variables[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return fieldValue && fieldValue.includes(value);
      case 'required':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue);
      case 'min_length':
        return fieldValue && fieldValue.length >= value;
      case 'max_length':
        return fieldValue && fieldValue.length <= value;
      default:
        return true;
    }
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, variables: any): boolean {
    try {
      // Simple condition evaluation - can be enhanced with a proper expression parser
      const expression = condition.replace(/\$(\w+)/g, (match, varName) => {
        return JSON.stringify(variables[varName] || null);
      });
      
      return new Function('return ' + expression)();
    } catch (error) {
      return false;
    }
  }

  /**
   * Estimate memory usage for a node result
   */
  private estimateMemoryUsage(node: FlowNode, result: any): number {
    // Simple memory estimation based on result size
    const resultSize = JSON.stringify(result).length;
    return resultSize * 2; // Rough estimate (2 bytes per character)
  }
}
