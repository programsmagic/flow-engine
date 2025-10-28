import { FlowServer } from '../server/FlowServer';
import { FlowEngine } from '../core/FlowEngine';
import { FlowLogger } from '../core/FlowLogger';
import { UserRegistrationFlow, OrderProcessingFlow } from '../examples/UserRegistrationFlow';

/**
 * Legacy Flow Engine App - For backward compatibility
 * Use the new SimpleFlowEngine for easier integration
 */
class FlowEngineApp {
  private server: FlowServer;
  private engine: FlowEngine;
  private logger: FlowLogger;

  constructor() {
    this.logger = new FlowLogger();
    this.engine = new FlowEngine();
    this.server = new FlowServer();
    
    this.setupExampleFlows();
  }

  /**
   * Setup example flows
   */
  private async setupExampleFlows(): Promise<void> {
    try {
      // Register example flows
      await this.engine.registerFlow(UserRegistrationFlow);
      await this.engine.registerFlow(OrderProcessingFlow);
      
      this.logger.success('🌊 Example flows registered successfully');
      this.logger.info('📋 Available flows:');
      this.logger.info('   • user-registration - Complete user registration process');
      this.logger.info('   • order-processing - Order processing with inventory and payment');
      
    } catch (error) {
      this.logger.error('Failed to register example flows', error);
    }
  }

  /**
   * Start the Flow Engine
   */
  async start(port: number = 3000, host: string = '0.0.0.0'): Promise<void> {
    try {
      this.logger.info('🌊 Starting Flow Engine...');
      
      // Start the server
      await this.server.start(port, host);
      
      this.logger.success('🚀 Flow Engine started successfully!');
      this.logger.info(`📊 Live Dashboard: http://${host}:${port}/dashboard`);
      this.logger.info(`🔗 API Base: http://${host}:${port}/api`);
      this.logger.info(`📡 WebSocket: ws://${host}:${port}`);
      
      // Log performance metrics every 30 seconds
      setInterval(() => {
        const stats = this.engine.getStatistics();
        this.logger.performance({
          totalExecutions: stats.metrics.totalExecutions,
          averageExecutionTime: stats.metrics.averageExecutionTime,
          successRate: 95, // This would be calculated from actual metrics
          memoryUsage: stats.memoryUsage
        });
      }, 30000);
      
    } catch (error) {
      this.logger.error('Failed to start Flow Engine', error);
      throw error;
    }
  }

  /**
   * Stop the Flow Engine
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('🛑 Stopping Flow Engine...');
      
      await this.server.stop();
      await this.engine.cleanup();
      
      this.logger.success('✅ Flow Engine stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping Flow Engine', error);
      throw error;
    }
  }

  /**
   * Get Flow Engine instance
   */
  getEngine(): FlowEngine {
    return this.engine;
  }

  /**
   * Get server instance
   */
  getServer(): FlowServer {
    return this.server;
  }
}

// Export for programmatic usage
export { FlowEngineApp, FlowServer, FlowEngine, FlowLogger };

// Start the app if this file is run directly
if (require.main === module) {
  const app = new FlowEngineApp();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });
  
  // Start the app
  app.start().catch((error) => {
    console.error('❌ Failed to start Flow Engine:', error);
    process.exit(1);
  });
}
