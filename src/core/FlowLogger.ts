import * as winston from 'winston';
import chalk from 'chalk';
import { createWriteStream } from 'fs';
import { join } from 'path';

/**
 * FlowLogger - Beautiful, colorful logging for Flow Engine
 */
export class FlowLogger {
  private logger: winston.Logger;
  private logStream: any;

  constructor() {
    this.setupLogger();
    this.setupLogStream();
  }

  /**
   * Setup Winston logger with beautiful formatting
   */
  private setupLogger(): void {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'flow-engine' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const time = new Date(timestamp).toLocaleTimeString();
              return `${chalk.gray(`[${time}]`)} ${level} ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            })
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    });
  }

  /**
   * Setup live log stream
   */
  private setupLogStream(): void {
    try {
      this.logStream = createWriteStream(join(process.cwd(), 'logs', 'live.log'), { flags: 'a' });
    } catch (error) {
      // Ignore if logs directory doesn't exist
    }
  }

  /**
   * Log info message with beautiful formatting
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
    this.writeToLiveLog('INFO', message, meta);
  }

  /**
   * Log error message with beautiful formatting
   */
  error(message: string, error?: any): void {
    this.logger.error(message, { error: error?.message, stack: error?.stack });
    this.writeToLiveLog('ERROR', message, { error: error?.message, stack: error?.stack });
  }

  /**
   * Log warning message with beautiful formatting
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
    this.writeToLiveLog('WARN', message, meta);
  }

  /**
   * Log debug message with beautiful formatting
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
    this.writeToLiveLog('DEBUG', message, meta);
  }

  /**
   * Log success message with beautiful formatting
   */
  success(message: string, meta?: any): void {
    const coloredMessage = chalk.green(`✅ ${message}`);
    this.logger.info(coloredMessage, meta);
    this.writeToLiveLog('SUCCESS', message, meta);
  }

  /**
   * Log flow execution with beautiful formatting
   */
  flowStart(flowId: string, executionId: string, input: any): void {
    const message = chalk.blue(`🚀 Flow Started: ${flowId} (${executionId})`);
    this.logger.info(message, { flowId, executionId, input });
    this.writeToLiveLog('FLOW_START', `Flow Started: ${flowId}`, { executionId, input });
  }

  /**
   * Log flow completion with beautiful formatting
   */
  flowComplete(flowId: string, executionId: string, executionTime: number, output: any): void {
    const message = chalk.green(`✅ Flow Completed: ${flowId} (${executionTime}ms)`);
    this.logger.info(message, { flowId, executionId, executionTime, output });
    this.writeToLiveLog('FLOW_COMPLETE', `Flow Completed: ${flowId}`, { executionId, executionTime, output });
  }

  /**
   * Log flow error with beautiful formatting
   */
  flowError(flowId: string, executionId: string, error: any): void {
    const message = chalk.red(`❌ Flow Failed: ${flowId} (${executionId})`);
    this.logger.error(message, { flowId, executionId, error: error.message });
    this.writeToLiveLog('FLOW_ERROR', `Flow Failed: ${flowId}`, { executionId, error: error.message });
  }

  /**
   * Log cache hit with beautiful formatting
   */
  cacheHit(flowId: string, executionId: string): void {
    const message = chalk.yellow(`💾 Cache Hit: ${flowId} (${executionId})`);
    this.logger.info(message, { flowId, executionId });
    this.writeToLiveLog('CACHE_HIT', `Cache Hit: ${flowId}`, { executionId });
  }

  /**
   * Log memory usage with beautiful formatting
   */
  memoryUsage(usage: number, threshold: number): void {
    const color = usage > threshold ? chalk.red : chalk.green;
    const message = color(`🧠 Memory Usage: ${usage}MB (Threshold: ${threshold}MB)`);
    this.logger.info(message, { usage, threshold });
    this.writeToLiveLog('MEMORY', `Memory Usage: ${usage}MB`, { usage, threshold });
  }

  /**
   * Log performance metrics with beautiful formatting
   */
  performance(metrics: {
    totalExecutions: number;
    averageExecutionTime: number;
    successRate: number;
    memoryUsage: number;
  }): void {
    const message = chalk.cyan(`📊 Performance: ${metrics.totalExecutions} executions, ${metrics.averageExecutionTime}ms avg, ${metrics.successRate}% success, ${metrics.memoryUsage}MB memory`);
    this.logger.info(message, metrics);
    this.writeToLiveLog('PERFORMANCE', 'Performance Metrics', metrics);
  }

  /**
   * Write to live log file
   */
  private writeToLiveLog(level: string, message: string, meta?: any): void {
    if (this.logStream) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        meta
      };
      this.logStream.write(JSON.stringify(logEntry) + '\n');
    }
  }

  /**
   * Get live log stream
   */
  getLiveLogStream() {
    return this.logStream;
  }

  /**
   * Close logger
   */
  close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}
