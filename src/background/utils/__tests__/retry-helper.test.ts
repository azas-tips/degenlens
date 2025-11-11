// Retry Helper Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff, retryAfterDelay } from '../retry-helper';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const promise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on network errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 100 });

    // Wait for first attempt to fail
    await vi.advanceTimersByTimeAsync(0);

    // Wait for retry delay
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on 5xx errors', async () => {
    const error = {
      response: { status: 500 },
    };

    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

    const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 100 });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry on 429 rate limit', async () => {
    const error = {
      response: { status: 429 },
    };

    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

    const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 100 });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 4xx errors (except 429)', async () => {
    const error = {
      response: { status: 400 },
    };

    const fn = vi.fn().mockRejectedValue(error);

    await expect(retryWithBackoff(fn, { maxAttempts: 3 })).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 100,
      backoffMultiplier: 2,
    });

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0);

    // First retry after 100ms
    await vi.advanceTimersByTimeAsync(100);

    // Second retry after 200ms (exponential)
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue('success');

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 100,
      backoffMultiplier: 10,
      maxDelay: 150,
    });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    // Should be capped at maxDelay (150ms) instead of 1000ms
    await vi.advanceTimersByTimeAsync(150);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const error = new TypeError('fetch failed');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 10 });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);

    await expect(promise).rejects.toThrow('fetch failed');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('retryAfterDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should wait specified time before retry', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const promise = retryAfterDelay(fn, 1000);

    // Function should not be called yet
    expect(fn).not.toHaveBeenCalled();

    // Advance time
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
