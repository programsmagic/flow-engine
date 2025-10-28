import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { FlowLogger } from '../core/FlowLogger';

/**
 * FlowMiddleware - Custom middleware for Flow Engine
 */
export class FlowMiddleware {
  private logger: FlowLogger;

  constructor() {
    this.logger = new FlowLogger();
  }

  /**
   * Request logging middleware
   */
  requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('Request completed', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip
        });
      });

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  /**
   * Memory monitoring middleware
   */
  memoryMonitor() {
    return (req: Request, res: Response, next: NextFunction) => {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      
      // Log memory usage for monitoring
      if (memoryUsageMB > 500) { // Alert if memory usage > 500MB
        this.logger.warn('High memory usage detected', {
          memoryUsageMB,
          url: req.url
        });
      }

      // Add memory info to response headers
      res.set('X-Memory-Usage', memoryUsageMB.toString());
      
      next();
    };
  }

  /**
   * Flow validation middleware
   */
  validateFlowInput(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.details
          });
        }

        req.body = value;
        next();
      } catch (err) {
        res.status(500).json({
          success: false,
          error: 'Validation error'
        });
      }
    };
  }

  /**
   * Authentication middleware
   */
  authenticate() {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // TODO: Implement actual token validation
      // For now, just add user info to request
      req.user = { id: 'user123', token };
      next();
    };
  }

  /**
   * CORS middleware for flow endpoints
   */
  flowCORS() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    };
  }
}
