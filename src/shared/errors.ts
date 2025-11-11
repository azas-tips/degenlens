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
  DEX_TIMEOUT: 'E_DEX_TIMEOUT',

  // OpenRouter related
  LLM_RATE_LIMIT: 'E_LLM_RATE_LIMIT',
  LLM_BAD_REQUEST: 'E_LLM_BAD_REQUEST',
  LLM_UNAUTHORIZED: 'E_LLM_UNAUTHORIZED',
  LLM_TIMEOUT: 'E_LLM_TIMEOUT',

  // System related
  INVALID_REQUEST: 'E_INVALID_REQUEST',
  STORAGE_ERROR: 'E_STORAGE_ERROR',
  NETWORK_ERROR: 'E_NETWORK_ERROR',
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
  retryAfterMs?: number; // Time to wait before retrying (for rate limits)
  suggestions?: string[]; // Actionable suggestions for the user
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
      const retryAfter = parseRetryAfter(error.response.headers.get('Retry-After'));
      const waitSeconds = Math.ceil(retryAfter / 1000);
      const serviceName = isLLM ? 'OpenRouter' : 'DEXscreener';

      return {
        code: isLLM ? ERR.LLM_RATE_LIMIT : ERR.DEX_RATE_LIMIT,
        userMessage: `Rate limit reached for ${serviceName}.${waitSeconds > 0 ? ` Please wait ${waitSeconds}s before retrying.` : ' Please try again later.'}`,
        developerMessage: error.message,
        retryAfterMs: retryAfter,
        suggestions: [
          waitSeconds > 0
            ? `Wait ${waitSeconds} seconds before retrying`
            : 'Wait a moment before retrying',
          isLLM ? 'Consider using a less demanding model' : 'Try analyzing fewer pairs',
        ],
      };
    }

    // 401/403: Authentication error
    if (status === 401 || status === 403) {
      const serviceName = isLLM ? 'OpenRouter' : 'DEXscreener';
      return {
        code: isLLM ? ERR.LLM_UNAUTHORIZED : ERR.DEX_UNAUTHORIZED,
        userMessage: `Invalid ${serviceName} API key. Please check your settings.`,
        developerMessage: error.message,
        suggestions: [
          'Click the extension icon and go to Settings',
          `Verify your ${serviceName} API key is correct`,
          isLLM
            ? 'Get a new API key from https://openrouter.ai/keys'
            : 'Check if DEXscreener API key is required',
        ],
      };
    }

    // 400-499: Other client errors
    if (status >= 400 && status < 500) {
      return {
        code: isLLM ? ERR.LLM_BAD_REQUEST : ERR.DEX_BAD_REQUEST,
        userMessage: 'Invalid request. Please check your input and try again.',
        developerMessage: error.message,
        suggestions: [
          'Try selecting a different chain or model',
          'Refresh the extension and try again',
        ],
      };
    }

    // 500-599: Server errors
    return {
      code: isLLM ? ERR.LLM_BAD_REQUEST : ERR.DEX_NETWORK_ERROR,
      userMessage: 'Server error occurred. Please try again later.',
      developerMessage: error.message,
      suggestions: [
        'Wait a few moments and try again',
        'Check if the service is experiencing issues',
      ],
    };
  }

  // TimeoutError (from ky or AbortError)
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    // Try to determine if it's a DEX or LLM timeout based on error message/stack
    const errorStr = String(error);
    const isLLM = errorStr.includes('openrouter') || errorStr.includes('chat/completions');
    const serviceName = isLLM ? 'LLM analysis' : 'DEX data fetch';

    return {
      code: isLLM ? ERR.LLM_TIMEOUT : ERR.DEX_TIMEOUT,
      userMessage: `Request timed out during ${serviceName}. Please try again.`,
      developerMessage: error.message,
      suggestions: [
        'Check your internet connection',
        isLLM
          ? 'Try a faster model (e.g., Claude Haiku instead of Sonnet)'
          : 'Try analyzing a different chain',
        'Reduce the number of pairs to analyze',
      ],
    };
  }

  // Network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ERR.NETWORK_ERROR,
      userMessage: 'Network error. Please check your internet connection.',
      developerMessage: error.message,
      suggestions: ['Check your internet connection', 'Try again in a moment'],
    };
  }

  // Other errors
  return {
    code: ERR.UNKNOWN,
    userMessage: 'Unexpected error occurred. Please try again.',
    developerMessage: error instanceof Error ? error.message : String(error),
    suggestions: ['Try refreshing the extension', 'Check the browser console for details'],
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
