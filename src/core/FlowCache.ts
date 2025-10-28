import { EventEmitter } from 'events';

/**
 * FlowCache - Intelligent caching system for flow results
 */
export class FlowCache extends EventEmitter {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private accessOrder: string[] = [];

  constructor(maxSize: number = 1000, ttl: number = 300000) { // 5 minutes default TTL
    super();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get cached result
   */
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(key);
    
    this.emit('cache:hit', { key });
    return entry.data;
  }

  /**
   * Set cached result
   */
  async set(key: string, data: any): Promise<void> {
    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      accessCount: 0
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    
    this.emit('cache:set', { key, size: this.cache.size });
  }

  /**
   * Delete cached result
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    this.removeFromAccessOrder(key);
    
    if (deleted) {
      this.emit('cache:delete', { key });
    }
    
    return deleted;
  }

  /**
   * Clear all cached results
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.emit('cache:clear');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let hits = 0;
    let misses = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > this.ttl) {
        expired++;
      }
      hits += entry.accessCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits,
      misses,
      expired,
      hitRate: hits / (hits + misses) || 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.cache.delete(lruKey);
    this.accessOrder.shift();
    
    this.emit('cache:evict', { key: lruKey });
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
    return totalSize;
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  expired: number;
  hitRate: number;
  memoryUsage: number;
}
