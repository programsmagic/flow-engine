import { Router } from 'express';
import { FlowEngine } from '../core/FlowEngine';
import { FlowDefinition } from '../types';

/**
 * FlowRoutes - Dynamic route generation for flow endpoints
 */
export class FlowRoutes {
  private router: Router;
  private engine: FlowEngine;

  constructor(engine: FlowEngine) {
    this.router = Router();
    this.engine = engine;
  }

  /**
   * Get Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Register a flow as an API endpoint
   */
  registerFlowRoute(definition: FlowDefinition, options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    middleware?: any[];
  }): void {
    const { method, path, middleware = [] } = options;

    // Apply middleware
    if (middleware.length > 0) {
      this.router.use(path, ...middleware);
    }

    // Register route
    this.router[method.toLowerCase()](path, async (req, res) => {
      try {
        const input = this.extractInput(req, method);
        const context = this.extractContext(req);

        const result = await this.engine.executeFlow(
          definition.id,
          input,
          context
        );

        res.json({
          success: true,
          data: result.output,
          execution: {
            id: result.id,
            executionTime: result.executionTime,
            memoryUsage: result.memoryUsage
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Extract input data from request
   */
  private extractInput(req: any, method: string): any {
    switch (method) {
      case 'GET':
        return req.query;
      case 'POST':
      case 'PUT':
      case 'PATCH':
        return req.body;
      case 'DELETE':
        return { ...req.query, ...req.body };
      default:
        return {};
    }
  }

  /**
   * Extract context from request
   */
  private extractContext(req: any): any {
    return {
      user: req.user,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers,
      timestamp: new Date().toISOString()
    };
  }
}
