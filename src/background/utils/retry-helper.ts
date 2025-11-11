// Retry Helper Utility
// Implements exponential backoff retry logic for API calls

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts?: number; // Default: 3
  initialDelay?: number; // Default: 1000ms
  maxDelay?: number; // Default: 10000ms
  backoffMultiplier?: number; // Default: 2
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Default retry condition
 * Retries on network errors and 5xx server errors
 */
function defaultShouldRetry(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP errors (ky)
  if (error && typeof error === 'object' && 'response' in error) {
    const httpError = error as { response: { status: number } };
    const status = httpError.response?.status;

    // Retry on 5xx server errors and 429 rate limit
    if (status >= 500 || status === 429) {
      return true;
    }
  }

  return false;
}

/**
 * Retry with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Log retry attempt
      console.log(
        `[Retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
        error
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

/**
 * Retry with linear backoff (for rate limiting)
 *
 * @param fn - Async function to retry
 * @param retryAfterMs - Wait time in milliseconds
 * @returns Result of the function
 */
export async function retryAfterDelay<T>(fn: () => Promise<T>, retryAfterMs: number): Promise<T> {
  console.log(`[Retry] Rate limited, waiting ${retryAfterMs}ms before retry...`);
  await new Promise(resolve => setTimeout(resolve, retryAfterMs));
  return await fn();
}
