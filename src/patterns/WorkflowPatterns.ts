import { Workflow, WorkflowNode, WorkflowEdge } from '../types';

/**
 * Real-world workflow patterns based on global coding standards
 * These patterns represent common architectural patterns used across different frameworks
 */

export class WorkflowPatterns {
  
  /**
   * MVC Pattern - Model-View-Controller
   * Used in Laravel, Rails, Spring MVC, ASP.NET MVC
   */
  public static createMVCPattern(): Workflow {
    return {
      id: 'mvc-pattern',
      name: 'MVC Pattern',
      description: 'Model-View-Controller architectural pattern',
      component: 'MVC',
      method: 'handleRequest',
      framework: 'universal',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Request Received',
          description: 'HTTP request arrives at controller'
        },
        {
          id: 'controller',
          type: 'process',
          label: 'Controller',
          description: 'Process request, validate input, coordinate business logic'
        },
        {
          id: 'model',
          type: 'database',
          label: 'Model',
          description: 'Handle data operations, business logic, database interactions'
        },
        {
          id: 'view',
          type: 'process',
          label: 'View',
          description: 'Render response, format data for presentation'
        },
        {
          id: 'end',
          type: 'end',
          label: 'Response Sent',
          description: 'Send response back to client'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'controller', label: 'Route to Controller' },
        { id: 'e2', source: 'controller', target: 'model', label: 'Process Data' },
        { id: 'e3', source: 'model', target: 'view', label: 'Pass Data' },
        { id: 'e4', source: 'view', target: 'end', label: 'Render Response' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['mvc', 'architecture', 'pattern'],
        framework: 'universal',
        language: 'universal',
        complexity: 'medium',
        performance: {
          cyclomaticComplexity: 4,
          linesOfCode: 50,
          dependencies: 3,
          apiCalls: 0,
          databaseQueries: 1
        }
      }
    };
  }

  /**
   * Repository Pattern
   * Used in Laravel, .NET, Java Spring, Node.js
   */
  public static createRepositoryPattern(): Workflow {
    return {
      id: 'repository-pattern',
      name: 'Repository Pattern',
      description: 'Data access abstraction pattern',
      component: 'Repository',
      method: 'getData',
      framework: 'universal',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Data Request',
          description: 'Request for data from service'
        },
        {
          id: 'service',
          type: 'process',
          label: 'Service Layer',
          description: 'Business logic and validation'
        },
        {
          id: 'repository',
          type: 'database',
          label: 'Repository',
          description: 'Data access abstraction'
        },
        {
          id: 'datasource',
          type: 'database',
          label: 'Data Source',
          description: 'Database, API, or file system'
        },
        {
          id: 'end',
          type: 'end',
          label: 'Data Returned',
          description: 'Data returned to service'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'service', label: 'Request Data' },
        { id: 'e2', source: 'service', target: 'repository', label: 'Query Repository' },
        { id: 'e3', source: 'repository', target: 'datasource', label: 'Access Data' },
        { id: 'e4', source: 'datasource', target: 'end', label: 'Return Data' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['repository', 'data-access', 'pattern'],
        framework: 'universal',
        language: 'universal',
        complexity: 'medium',
        performance: {
          cyclomaticComplexity: 3,
          linesOfCode: 40,
          dependencies: 2,
          apiCalls: 0,
          databaseQueries: 1
        }
      }
    };
  }

  /**
   * Observer Pattern
   * Used in React, Vue, Angular, Node.js EventEmitter
   */
  public static createObserverPattern(): Workflow {
    return {
      id: 'observer-pattern',
      name: 'Observer Pattern',
      description: 'Event-driven architecture pattern',
      component: 'Observer',
      method: 'notify',
      framework: 'universal',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Event Triggered',
          description: 'Subject state changes'
        },
        {
          id: 'subject',
          type: 'process',
          label: 'Subject',
          description: 'Maintains list of observers'
        },
        {
          id: 'notify',
          type: 'process',
          label: 'Notify Observers',
          description: 'Notify all registered observers'
        },
        {
          id: 'observer1',
          type: 'process',
          label: 'Observer 1',
          description: 'First observer updates'
        },
        {
          id: 'observer2',
          type: 'process',
          label: 'Observer 2',
          description: 'Second observer updates'
        },
        {
          id: 'end',
          type: 'end',
          label: 'All Updated',
          description: 'All observers notified'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'subject', label: 'State Change' },
        { id: 'e2', source: 'subject', target: 'notify', label: 'Trigger Notification' },
        { id: 'e3', source: 'notify', target: 'observer1', label: 'Notify Observer 1' },
        { id: 'e4', source: 'notify', target: 'observer2', label: 'Notify Observer 2' },
        { id: 'e5', source: 'observer1', target: 'end', label: 'Update Complete' },
        { id: 'e6', source: 'observer2', target: 'end', label: 'Update Complete' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['observer', 'event-driven', 'pattern'],
        framework: 'universal',
        language: 'universal',
        complexity: 'high',
        performance: {
          cyclomaticComplexity: 5,
          linesOfCode: 60,
          dependencies: 3,
          apiCalls: 0,
          databaseQueries: 0
        }
      }
    };
  }

  /**
   * API Gateway Pattern
   * Used in microservices, AWS API Gateway, Kong, Zuul
   */
  public static createAPIGatewayPattern(): Workflow {
    return {
      id: 'api-gateway-pattern',
      name: 'API Gateway Pattern',
      description: 'Single entry point for microservices',
      component: 'APIGateway',
      method: 'routeRequest',
      framework: 'universal',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Client Request',
          description: 'Client sends request to API Gateway'
        },
        {
          id: 'auth',
          type: 'validation',
          label: 'Authentication',
          description: 'Validate JWT token or API key'
        },
        {
          id: 'rate-limit',
          type: 'validation',
          label: 'Rate Limiting',
          description: 'Check rate limits and quotas'
        },
        {
          id: 'routing',
          type: 'decision',
          label: 'Route Decision',
          description: 'Determine target microservice'
        },
        {
          id: 'service1',
          type: 'api',
          label: 'User Service',
          description: 'Forward to user microservice'
        },
        {
          id: 'service2',
          type: 'api',
          label: 'Order Service',
          description: 'Forward to order microservice'
        },
        {
          id: 'aggregate',
          type: 'process',
          label: 'Aggregate Response',
          description: 'Combine responses from services'
        },
        {
          id: 'end',
          type: 'end',
          label: 'Response Sent',
          description: 'Send aggregated response to client'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'auth', label: 'Authenticate' },
        { id: 'e2', source: 'auth', target: 'rate-limit', label: 'Check Rate Limit' },
        { id: 'e3', source: 'rate-limit', target: 'routing', label: 'Route Request' },
        { id: 'e4', source: 'routing', target: 'service1', label: 'User Request', condition: 'user-related' },
        { id: 'e5', source: 'routing', target: 'service2', label: 'Order Request', condition: 'order-related' },
        { id: 'e6', source: 'service1', target: 'aggregate', label: 'User Response' },
        { id: 'e7', source: 'service2', target: 'aggregate', label: 'Order Response' },
        { id: 'e8', source: 'aggregate', target: 'end', label: 'Send Response' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['api-gateway', 'microservices', 'pattern'],
        framework: 'universal',
        language: 'universal',
        complexity: 'high',
        performance: {
          cyclomaticComplexity: 6,
          linesOfCode: 80,
          dependencies: 4,
          apiCalls: 2,
          databaseQueries: 0
        }
      }
    };
  }

  /**
   * CQRS Pattern (Command Query Responsibility Segregation)
   * Used in .NET, Java, Node.js, Event Sourcing
   */
  public static createCQRSPattern(): Workflow {
    return {
      id: 'cqrs-pattern',
      name: 'CQRS Pattern',
      description: 'Command Query Responsibility Segregation',
      component: 'CQRS',
      method: 'handleCommand',
      framework: 'universal',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Command/Query',
          description: 'Client sends command or query'
        },
        {
          id: 'router',
          type: 'decision',
          label: 'Route Decision',
          description: 'Determine if command or query'
        },
        {
          id: 'command',
          type: 'process',
          label: 'Command Handler',
          description: 'Process write operations'
        },
        {
          id: 'query',
          type: 'process',
          label: 'Query Handler',
          description: 'Process read operations'
        },
        {
          id: 'write-db',
          type: 'database',
          label: 'Write Database',
          description: 'Update write model'
        },
        {
          id: 'read-db',
          type: 'database',
          label: 'Read Database',
          description: 'Query read model'
        },
        {
          id: 'event',
          type: 'process',
          label: 'Event Store',
          description: 'Store domain events'
        },
        {
          id: 'end',
          type: 'end',
          label: 'Response',
          description: 'Return result to client'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'router', label: 'Route Request' },
        { id: 'e2', source: 'router', target: 'command', label: 'Command', condition: 'is-command' },
        { id: 'e3', source: 'router', target: 'query', label: 'Query', condition: 'is-query' },
        { id: 'e4', source: 'command', target: 'write-db', label: 'Update Write Model' },
        { id: 'e5', source: 'command', target: 'event', label: 'Store Event' },
        { id: 'e6', source: 'query', target: 'read-db', label: 'Query Read Model' },
        { id: 'e7', source: 'write-db', target: 'end', label: 'Command Result' },
        { id: 'e8', source: 'read-db', target: 'end', label: 'Query Result' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['cqrs', 'event-sourcing', 'pattern'],
        framework: 'universal',
        language: 'universal',
        complexity: 'high',
        performance: {
          cyclomaticComplexity: 7,
          linesOfCode: 100,
          dependencies: 5,
          apiCalls: 0,
          databaseQueries: 2
        }
      }
    };
  }

  /**
   * React Component Lifecycle Pattern
   */
  public static createReactLifecyclePattern(): Workflow {
    return {
      id: 'react-lifecycle-pattern',
      name: 'React Component Lifecycle',
      description: 'React component lifecycle workflow',
      component: 'ReactComponent',
      method: 'render',
      framework: 'react',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'Component Mount',
          description: 'Component is being mounted'
        },
        {
          id: 'constructor',
          type: 'lifecycle',
          label: 'Constructor',
          description: 'Initialize component state'
        },
        {
          id: 'componentDidMount',
          type: 'lifecycle',
          label: 'componentDidMount',
          description: 'Component mounted, run side effects'
        },
        {
          id: 'render',
          type: 'process',
          label: 'Render',
          description: 'Render component UI'
        },
        {
          id: 'update',
          type: 'lifecycle',
          label: 'componentDidUpdate',
          description: 'Component updated, run side effects'
        },
        {
          id: 'unmount',
          type: 'lifecycle',
          label: 'componentWillUnmount',
          description: 'Cleanup before unmount'
        },
        {
          id: 'end',
          type: 'end',
          label: 'Component Unmounted',
          description: 'Component is unmounted'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'constructor', label: 'Initialize' },
        { id: 'e2', source: 'constructor', target: 'componentDidMount', label: 'Mount' },
        { id: 'e3', source: 'componentDidMount', target: 'render', label: 'Render' },
        { id: 'e4', source: 'render', target: 'update', label: 'State Change' },
        { id: 'e5', source: 'update', target: 'render', label: 'Re-render' },
        { id: 'e6', source: 'render', target: 'unmount', label: 'Unmount' },
        { id: 'e7', source: 'unmount', target: 'end', label: 'Cleanup' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['react', 'lifecycle', 'component'],
        framework: 'react',
        language: 'javascript',
        complexity: 'medium',
        performance: {
          cyclomaticComplexity: 4,
          linesOfCode: 60,
          dependencies: 2,
          apiCalls: 1,
          databaseQueries: 0
        }
      }
    };
  }

  /**
   * Express.js Middleware Pattern
   */
  public static createExpressMiddlewarePattern(): Workflow {
    return {
      id: 'express-middleware-pattern',
      name: 'Express Middleware Pattern',
      description: 'Express.js middleware chain workflow',
      component: 'ExpressApp',
      method: 'handleRequest',
      framework: 'nodejs',
      nodes: [
        {
          id: 'start',
          type: 'start',
          label: 'HTTP Request',
          description: 'Incoming HTTP request'
        },
        {
          id: 'cors',
          type: 'middleware',
          label: 'CORS Middleware',
          description: 'Handle Cross-Origin Resource Sharing'
        },
        {
          id: 'auth',
          type: 'middleware',
          label: 'Authentication',
          description: 'Verify JWT token'
        },
        {
          id: 'validation',
          type: 'middleware',
          label: 'Validation',
          description: 'Validate request body and parameters'
        },
        {
          id: 'rate-limit',
          type: 'middleware',
          label: 'Rate Limiting',
          description: 'Check rate limits'
        },
        {
          id: 'handler',
          type: 'process',
          label: 'Route Handler',
          description: 'Process business logic'
        },
        {
          id: 'response',
          type: 'process',
          label: 'Send Response',
          description: 'Send response to client'
        },
        {
          id: 'end',
          type: 'end',
          label: 'Request Complete',
          description: 'Request processing complete'
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'cors', label: 'Apply CORS' },
        { id: 'e2', source: 'cors', target: 'auth', label: 'Authenticate' },
        { id: 'e3', source: 'auth', target: 'validation', label: 'Validate' },
        { id: 'e4', source: 'validation', target: 'rate-limit', label: 'Check Rate' },
        { id: 'e5', source: 'rate-limit', target: 'handler', label: 'Process' },
        { id: 'e6', source: 'handler', target: 'response', label: 'Respond' },
        { id: 'e7', source: 'response', target: 'end', label: 'Complete' }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: ['express', 'middleware', 'nodejs'],
        framework: 'nodejs',
        language: 'javascript',
        complexity: 'medium',
        performance: {
          cyclomaticComplexity: 5,
          linesOfCode: 70,
          dependencies: 4,
          apiCalls: 0,
          databaseQueries: 1
        }
      }
    };
  }

  /**
   * Get all available patterns
   */
  public static getAllPatterns(): Workflow[] {
    return [
      this.createMVCPattern(),
      this.createRepositoryPattern(),
      this.createObserverPattern(),
      this.createAPIGatewayPattern(),
      this.createCQRSPattern(),
      this.createReactLifecyclePattern(),
      this.createExpressMiddlewarePattern()
    ];
  }

  /**
   * Get patterns by framework
   */
  public static getPatternsByFramework(framework: string): Workflow[] {
    return this.getAllPatterns().filter(pattern => 
      pattern.framework === framework || pattern.framework === 'universal'
    );
  }

  /**
   * Get patterns by complexity
   */
  public static getPatternsByComplexity(complexity: 'low' | 'medium' | 'high'): Workflow[] {
    return this.getAllPatterns().filter(pattern => 
      pattern.metadata.complexity === complexity
    );
  }
}
