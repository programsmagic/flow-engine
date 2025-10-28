import { EventEmitter } from 'events';

/**
 * MemoryManager - Optimizes memory usage for flow execution
 */
export class MemoryManager extends EventEmitter {
  private memoryUsage: Map<string, number> = new Map();
  private maxMemory: number;
  private currentUsage: number = 0;
  private memoryThreshold: number = 0.8; // 80% threshold

  constructor(maxMemory: number = 1024 * 1024 * 1024) { // 1GB default
    super();
    this.maxMemory = maxMemory;
  }

  /**
   * Update memory usage for a specific node
   */
  updateUsage(nodeId: string, usage: number): void {
    const previousUsage = this.memoryUsage.get(nodeId) || 0;
    this.currentUsage = this.currentUsage - previousUsage + usage;
    this.memoryUsage.set(nodeId, usage);

    // Check memory threshold
    if (this.currentUsage > this.maxMemory * this.memoryThreshold) {
      this.emit('memory:warning', {
        currentUsage: this.currentUsage,
        maxMemory: this.maxMemory,
        threshold: this.memoryThreshold
      });
    }

    // Check if memory limit exceeded
    if (this.currentUsage > this.maxMemory) {
      this.emit('memory:critical', {
        currentUsage: this.currentUsage,
        maxMemory: this.maxMemory
      });
      this.cleanupMemory();
    }
  }

  /**
   * Get current memory usage
   */
  getCurrentUsage(): number {
    return this.currentUsage;
  }

  /**
   * Get available memory
   */
  getAvailableMemory(): number {
    return this.maxMemory - this.currentUsage;
  }

  /**
   * Get memory usage by node
   */
  getMemoryUsageByNode(): Map<string, number> {
    return new Map(this.memoryUsage);
  }

  /**
   * Cleanup memory by removing least recently used nodes
   */
  private cleanupMemory(): void {
    const sortedNodes = Array.from(this.memoryUsage.entries())
      .sort(([, a], [, b]) => a - b);

    let freedMemory = 0;
    for (const [nodeId, usage] of sortedNodes) {
      if (this.currentUsage - freedMemory <= this.maxMemory * 0.7) {
        break; // Stop when we're at 70% usage
      }
      
      this.memoryUsage.delete(nodeId);
      freedMemory += usage;
    }

    this.currentUsage -= freedMemory;
    this.emit('memory:cleaned', { freedMemory, remainingUsage: this.currentUsage });
  }

  /**
   * Reset memory usage
   */
  reset(): void {
    this.memoryUsage.clear();
    this.currentUsage = 0;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.reset();
  }
}
