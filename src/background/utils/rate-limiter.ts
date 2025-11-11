// Rate Limiter Utility
// Controls concurrent API request execution

/**
 * Rate Limiter
 * Limits the number of concurrent async operations
 */
export class RateLimiter {
  private readonly maxConcurrent: number;
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Execute a function with rate limiting
   * If max concurrent operations are running, queue the operation
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If at capacity, wait in queue
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      // Start next queued operation
      const next = this.queue.shift();
      if (next) next();
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
  }
}

// Global rate limiters for different APIs
export const dexLimiter = new RateLimiter(2); // DEXscreener: 2 concurrent
export const llmLimiter = new RateLimiter(1); // OpenRouter: 1 concurrent (safer for LLM APIs)
