import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { FlowEngine } from '../core/FlowEngine';
import { FlowLogger } from '../core/FlowLogger';
import { FlowRoutes } from './FlowRoutes';
import { FlowMiddleware } from './FlowMiddleware';
import { LiveDashboard } from './LiveDashboard';

/**
 * FlowServer - Express server with live monitoring and beautiful UI
 */
export class FlowServer {
  private app: express.Application;
  private server: any;
  private io: Server;
  private engine: FlowEngine;
  private logger: FlowLogger;
  private routes: FlowRoutes;
  private middleware: FlowMiddleware;
  private dashboard: LiveDashboard;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.engine = new FlowEngine();
    this.logger = new FlowLogger();
    this.routes = new FlowRoutes(this.engine);
    this.middleware = new FlowMiddleware();
    this.dashboard = new LiveDashboard(this.engine, this.io);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Custom flow middleware
    this.app.use(this.middleware.requestLogger());
    this.app.use(this.middleware.rateLimiter());
    this.app.use(this.middleware.memoryMonitor());
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        flows: this.engine.getStatistics()
      });
    });

    // Live monitoring endpoint
    this.app.get('/api/monitor/live', (req, res) => {
      res.json({
        success: true,
        data: this.engine.getLiveData()
      });
    });

    // Flow execution endpoint
    this.app.post('/api/flows/:flowId/execute', async (req, res) => {
      try {
        const { flowId } = req.params;
        const { input, context } = req.body;

        const result = await this.engine.executeFlow(flowId, input, context);
        
        res.json({
          success: true,
          data: result
        });

      } catch (error) {
        this.logger.error('Flow execution failed', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Flow registration endpoint
    this.app.post('/api/flows/register', async (req, res) => {
      try {
        const definition = req.body;
        await this.engine.registerFlow(definition);
        
        res.json({
          success: true,
          message: 'Flow registered successfully'
        });

      } catch (error) {
        this.logger.error('Flow registration failed', error);
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get flow status
    this.app.get('/api/flows/:executionId/status', async (req, res) => {
      try {
        const { executionId } = req.params;
        const flows = this.engine.getActiveFlows();
        const flow = flows.find(f => f.id === executionId);
        
        if (!flow) {
          return res.status(404).json({
            success: false,
            error: 'Flow not found'
          });
        }

        res.json({
          success: true,
          data: flow
        });

      } catch (error) {
        this.logger.error('Failed to get flow status', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get flow statistics
    this.app.get('/api/flows/statistics', async (req, res) => {
      try {
        const stats = this.engine.getStatistics();
        res.json({
          success: true,
          data: stats
        });

      } catch (error) {
        this.logger.error('Failed to get statistics', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Live dashboard
    this.app.get('/dashboard', (req, res) => {
      res.send(this.dashboard.getDashboardHTML());
    });

    // Dynamic route registration
    this.app.use('/api/flows', this.routes.getRouter());
  }

  /**
   * Setup Socket.IO for real-time monitoring
   */
  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      this.logger.info(`📡 Client connected: ${socket.id}`);
      
      // Send initial data
      socket.emit('initial-data', this.engine.getLiveData());
      
      // Handle client requests
      socket.on('request-update', () => {
        socket.emit('live-update', this.engine.getLiveData());
      });
      
      socket.on('disconnect', () => {
        this.logger.info(`📡 Client disconnected: ${socket.id}`);
      });
    });

    // Broadcast updates every 2 seconds
    setInterval(() => {
      this.io.emit('live-update', this.engine.getLiveData());
    }, 2000);
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  /**
   * Start the server
   */
  async start(port: number = 3000, host: string = '0.0.0.0'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, host, (error: any) => {
        if (error) {
          this.logger.error('Failed to start server', error);
          reject(error);
        } else {
          this.logger.success(`🚀 Flow Server started on ${host}:${port}`);
          this.logger.info(`📊 Live Dashboard: http://${host}:${port}/dashboard`);
          this.logger.info(`📡 WebSocket: ws://${host}:${port}`);
          this.logger.info(`🔗 API Base: http://${host}:${port}/api`);
          resolve();
        }
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Flow server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get Flow Engine
   */
  getEngine(): FlowEngine {
    return this.engine;
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): Server {
    return this.io;
  }
}
