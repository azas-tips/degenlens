// Error Code System
// Separates internal error codes from user-facing messages

import { translate } from '@/i18n/translate';

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
  USER_CANCELLED: 'E_USER_CANCELLED',
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
 * Now async to support i18n
 */
export async function handleApiError(error: unknown): Promise<ErrorInfo> {
  // HTTPError case
  if (isHTTPError(error)) {
    const status = error.response.status;
    const isLLM = error.response.url.includes('openrouter');

    // 429: Rate limit
    if (status === 429) {
      const retryAfter = parseRetryAfter(error.response.headers.get('Retry-After'));
      const waitSeconds = Math.ceil(retryAfter / 1000);
      const serviceName = isLLM ? 'OpenRouter' : 'DEXscreener';

      // Check if it's a free model (extract from URL or error message)
      const isFreeModel = error.response.url.includes(':free');

      const waitMessage =
        waitSeconds > 0
          ? await translate('error.waitSeconds', { seconds: waitSeconds })
          : await translate('error.waitLater');

      const freeModelNote = isFreeModel ? await translate('error.freeModelNote') : '';

      const userMessage = await translate('error.rateLimit', {
        service: serviceName,
        waitMessage,
        freeModelNote,
      });

      const suggestions: string[] = [];
      if (waitSeconds > 0) {
        suggestions.push(await translate('error.suggestion.wait', { seconds: waitSeconds }));
      } else {
        suggestions.push(await translate('error.suggestion.waitMoment'));
      }

      if (isLLM) {
        if (isFreeModel) {
          suggestions.push(
            await translate('error.suggestion.freeModelLimits'),
            await translate('error.suggestion.usePaidModel'),
            await translate('error.suggestion.tryLater')
          );
        } else {
          suggestions.push(
            await translate('error.suggestion.tryDifferentModel'),
            await translate('error.suggestion.checkAccountLimits')
          );
        }
      } else {
        suggestions.push(await translate('error.suggestion.tryFewerPairs'));
      }

      return {
        code: isLLM ? ERR.LLM_RATE_LIMIT : ERR.DEX_RATE_LIMIT,
        userMessage,
        developerMessage: error.message,
        retryAfterMs: retryAfter,
        suggestions,
      };
    }

    // 401/403: Authentication error
    if (status === 401 || status === 403) {
      const serviceName = isLLM ? 'OpenRouter' : 'DEXscreener';
      return {
        code: isLLM ? ERR.LLM_UNAUTHORIZED : ERR.DEX_UNAUTHORIZED,
        userMessage: await translate('error.authError', { service: serviceName }),
        developerMessage: error.message,
        suggestions: [
          await translate('error.suggestion.goToSettings'),
          await translate('error.suggestion.verifyApiKey', { service: serviceName }),
          isLLM
            ? await translate('error.suggestion.getNewKey', { url: 'https://openrouter.ai/keys' })
            : 'Check if DEXscreener API key is required', // No translation for now
        ],
      };
    }

    // 404: Model/Resource not found
    if (status === 404) {
      if (isLLM) {
        return {
          code: ERR.LLM_BAD_REQUEST,
          userMessage: await translate('error.modelNotAvailable'),
          developerMessage: `${error.message} (URL: ${error.response.url})`,
          suggestions: [
            await translate('error.suggestion.tryDifferentChain'),
            await translate('error.suggestion.refreshExtension'),
            await translate('error.suggestion.checkDeprecated'),
          ],
        };
      }
      return {
        code: ERR.DEX_BAD_REQUEST,
        userMessage: await translate('error.resourceNotFound'),
        developerMessage: error.message,
        suggestions: [
          await translate('error.suggestion.tryDifferentChain'),
          await translate('error.suggestion.refreshExtension'),
        ],
      };
    }

    // 400-499: Other client errors
    if (status >= 400 && status < 500) {
      return {
        code: isLLM ? ERR.LLM_BAD_REQUEST : ERR.DEX_BAD_REQUEST,
        userMessage: await translate('error.invalidRequest'),
        developerMessage: error.message,
        suggestions: [
          await translate('error.suggestion.tryDifferentChain'),
          await translate('error.suggestion.refreshExtension'),
        ],
      };
    }

    // 500-599: Server errors
    return {
      code: isLLM ? ERR.LLM_BAD_REQUEST : ERR.DEX_NETWORK_ERROR,
      userMessage: await translate('error.serverError'),
      developerMessage: error.message,
      suggestions: [
        await translate('error.suggestion.waitMoment'),
        await translate('error.suggestion.checkServiceStatus'),
      ],
    };
  }

  // TimeoutError (from ky or AbortError)
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    // Try to determine if it's a DEX or LLM timeout based on error message/stack
    const errorStr = String(error);
    const isLLM = errorStr.includes('openrouter') || errorStr.includes('chat/completions');
    const serviceName = isLLM ? 'LLM analysis' : 'DEX data fetch';

    const suggestions: string[] = [await translate('error.suggestion.checkInternet')];
    if (isLLM) {
      suggestions.push(await translate('error.suggestion.tryFasterModel'));
    } else {
      suggestions.push(await translate('error.suggestion.tryDifferentChain'));
    }
    suggestions.push(await translate('error.suggestion.tryFewerPairs'));

    return {
      code: isLLM ? ERR.LLM_TIMEOUT : ERR.DEX_TIMEOUT,
      userMessage: await translate('error.timeout', { service: serviceName }),
      developerMessage: error.message,
      suggestions,
    };
  }

  // Network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ERR.NETWORK_ERROR,
      userMessage: await translate('error.networkError'),
      developerMessage: error.message,
      suggestions: [
        await translate('error.suggestion.checkInternet'),
        await translate('error.suggestion.waitMoment'),
      ],
    };
  }

  // Other errors
  return {
    code: ERR.UNKNOWN,
    userMessage: await translate('error.unknownError'),
    developerMessage: error instanceof Error ? error.message : String(error),
    suggestions: [
      await translate('error.suggestion.refreshExtension'),
      await translate('error.suggestion.checkConsole'),
    ],
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
