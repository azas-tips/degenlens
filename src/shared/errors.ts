// Error Code System
// Separates internal error codes from user-facing messages

/**
 * Error code constants
 */
export const ERR = {
  // DEXscreener related
  DEX_RATE_LIMIT: 'E_DEX_RATE_LIMIT',
  DEX_BAD_REQUEST: 'E_DEX_BAD_REQUEST',
  DEX_UNAUTHORIZED: 'E_DEX_UNAUTHORIZED',
  DEX_NETWORK_ERROR: 'E_DEX_NETWORK_ERROR',

  // OpenRouter related
  LLM_RATE_LIMIT: 'E_LLM_RATE_LIMIT',
  LLM_BAD_REQUEST: 'E_LLM_BAD_REQUEST',
  LLM_UNAUTHORIZED: 'E_LLM_UNAUTHORIZED',
  LLM_TIMEOUT: 'E_LLM_TIMEOUT',

  // System related
  INVALID_REQUEST: 'E_INVALID_REQUEST',
  STORAGE_ERROR: 'E_STORAGE_ERROR',
  UNKNOWN: 'E_UNKNOWN',
} as const;

export type ErrorCode = (typeof ERR)[keyof typeof ERR];

/**
 * Error information
 */
export interface ErrorInfo {
  code: ErrorCode;
  userMessage: string; // User-facing message
  developerMessage?: string; // Developer message (for logging)
}

/**
 * HTTPError type (ky-compatible)
 */
export interface HTTPError extends Error {
  response: {
    status: number;
    url: string;
    headers: {
      get(name: string): string | null;
    };
  };
}

/**
 * Check if error is HTTPError
 */
export function isHTTPError(error: unknown): error is HTTPError {
  return (
    error instanceof Error &&
    'response' in error &&
    typeof (error as HTTPError).response === 'object' &&
    'status' in (error as HTTPError).response
  );
}

/**
 * API error handler
 * Converts HTTP errors and timeouts to appropriate ErrorInfo
 */
export function handleApiError(error: unknown): ErrorInfo {
  // HTTPError case
  if (isHTTPError(error)) {
    const status = error.response.status;
    const isLLM = error.response.url.includes('openrouter');

    // 429: Rate limit
    if (status === 429) {
      return {
        code: isLLM ? ERR.LLM_RATE_LIMIT : ERR.DEX_RATE_LIMIT,
        userMessage: 'Rate limit reached. Please wait and try again.',
        developerMessage: error.message,
      };
    }

    // 401/403: Authentication error
    if (status === 401 || status === 403) {
      return {
        code: isLLM ? ERR.LLM_UNAUTHORIZED : ERR.DEX_UNAUTHORIZED,
        userMessage: 'Invalid API key. Please check your settings.',
        developerMessage: error.message,
      };
    }

    // 400-499: Other client errors
    if (status >= 400 && status < 500) {
      return {
        code: isLLM ? ERR.LLM_BAD_REQUEST : ERR.DEX_BAD_REQUEST,
        userMessage: 'Request error occurred.',
        developerMessage: error.message,
      };
    }

    // 500-599: Server errors
    return {
      code: isLLM ? ERR.LLM_BAD_REQUEST : ERR.DEX_NETWORK_ERROR,
      userMessage: 'Server error occurred. Please try again later.',
      developerMessage: error.message,
    };
  }

  // AbortError (timeout) case
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      code: ERR.LLM_TIMEOUT,
      userMessage: 'Request timed out. Please try again.',
      developerMessage: error.message,
    };
  }

  // Other errors
  return {
    code: ERR.UNKNOWN,
    userMessage: 'Unexpected error occurred.',
    developerMessage: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Parse Retry-After header and return wait time in milliseconds
 */
export function parseRetryAfter(header: string | null): number {
  if (!header) return 0;

  // Seconds format (e.g. "60")
  const secs = Number(header);
  if (!Number.isNaN(secs)) {
    return Math.max(0, secs) * 1000;
  }

  // Date format (e.g. "Wed, 21 Oct 2025 07:28:00 GMT")
  const when = Date.parse(header);
  if (!Number.isNaN(when)) {
    const delta = when - Date.now();
    return Math.max(0, delta);
  }

  return 0;
}
