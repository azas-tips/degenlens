// Rate Limiter Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute function immediately when under limit', async () => {
    const limiter = new RateLimiter(2);
    const fn = vi.fn().mockResolvedValue('result');

    const result = await limiter.execute(fn);

    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should allow concurrent executions up to max', async () => {
    const limiter = new RateLimiter(2);
    let activeCount = 0;
    let maxActive = 0;

    const fn = async () => {
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      await new Promise(resolve => setTimeout(resolve, 10));
      activeCount--;
      return 'done';
    };

    // Start 4 concurrent requests
    const promises = [
      limiter.execute(fn),
      limiter.execute(fn),
      limiter.execute(fn),
      limiter.execute(fn),
    ];

    await Promise.all(promises);

    // Should never have more than 2 concurrent
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('should queue executions when at capacity', async () => {
    const limiter = new RateLimiter(1);
    const executionOrder: number[] = [];

    const fn = async (id: number) => {
      executionOrder.push(id);
      await new Promise(resolve => setTimeout(resolve, 10));
      return id;
    };

    // Start 3 requests (only 1 can run at a time)
    const promises = [
      limiter.execute(() => fn(1)),
      limiter.execute(() => fn(2)),
      limiter.execute(() => fn(3)),
    ];

    await Promise.all(promises);

    // Should execute in order
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('should handle errors without breaking queue', async () => {
    const limiter = new RateLimiter(1);

    const fn1 = vi.fn().mockRejectedValue(new Error('fail'));
    const fn2 = vi.fn().mockResolvedValue('success');

    // First execution fails
    await expect(limiter.execute(fn1)).rejects.toThrow('fail');

    // Second execution should still work
    const result = await limiter.execute(fn2);
    expect(result).toBe('success');
  });

  it('should properly decrement counter on error', async () => {
    const limiter = new RateLimiter(1);

    const errorFn = async () => {
      throw new Error('fail');
    };

    const successFn = async () => {
      return 'success';
    };

    // Execute error function
    await expect(limiter.execute(errorFn)).rejects.toThrow('fail');

    // Should be able to execute immediately (counter decremented)
    const result = await limiter.execute(successFn);
    expect(result).toBe('success');
  });

  it('should handle multiple limiters independently', async () => {
    const limiter1 = new RateLimiter(1);
    const limiter2 = new RateLimiter(2);

    let active1 = 0;
    let active2 = 0;
    let maxActive1 = 0;
    let maxActive2 = 0;

    const fn1 = async () => {
      active1++;
      maxActive1 = Math.max(maxActive1, active1);
      await new Promise(resolve => setTimeout(resolve, 10));
      active1--;
    };

    const fn2 = async () => {
      active2++;
      maxActive2 = Math.max(maxActive2, active2);
      await new Promise(resolve => setTimeout(resolve, 10));
      active2--;
    };

    // Execute multiple requests on both limiters
    const promises = [
      limiter1.execute(fn1),
      limiter1.execute(fn1),
      limiter1.execute(fn1),
      limiter2.execute(fn2),
      limiter2.execute(fn2),
      limiter2.execute(fn2),
    ];

    await Promise.all(promises);

    expect(maxActive1).toBe(1);
    expect(maxActive2).toBeLessThanOrEqual(2);
  });
});
