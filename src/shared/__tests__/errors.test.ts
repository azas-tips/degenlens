// Error Handler Tests
import { describe, it, expect } from 'vitest';
import { handleApiError, parseRetryAfter, ERR, isHTTPError } from '../errors';

// HTTP Error type for testing
interface HTTPError extends Error {
  response: {
    status: number;
    url: string;
    headers: {
      get: (key: string) => string | null;
    };
  };
}

describe('isHTTPError', () => {
  it('should identify HTTP errors correctly', async () => {
    const httpError = new Error('HTTP Error') as HTTPError;
    httpError.response = {
      status: 404,
      url: 'https://api.example.com',
      headers: {
        get: () => null,
      },
    };

    expect(isHTTPError(httpError)).toBe(true);
  });

  it('should return false for non-HTTP errors', async () => {
    const normalError = new Error('normal error');
    expect(isHTTPError(normalError)).toBe(false);

    const nullError = null;
    expect(isHTTPError(nullError)).toBe(false);
  });
});

describe('parseRetryAfter', () => {
  it('should parse seconds format', async () => {
    expect(parseRetryAfter('60')).toBe(60000);
    expect(parseRetryAfter('120')).toBe(120000);
    expect(parseRetryAfter('0')).toBe(0);
  });

  it('should parse HTTP date format', async () => {
    const futureDate = new Date(Date.now() + 5000).toUTCString();
    const result = parseRetryAfter(futureDate);

    // Should be approximately 5 seconds
    expect(result).toBeGreaterThan(4000);
    expect(result).toBeLessThan(6000);
  });

  it('should return 0 for null', async () => {
    expect(parseRetryAfter(null)).toBe(0);
  });

  it('should return 0 for invalid format', async () => {
    expect(parseRetryAfter('invalid')).toBe(0);
  });

  it('should handle negative values gracefully', async () => {
    expect(parseRetryAfter('-5')).toBe(0);
  });
});

describe('handleApiError', () => {
  describe('HTTP errors', () => {
    it('should handle 429 rate limit with DEX API', async () => {
      const error = new Error('Rate limited') as HTTPError;
      error.response = {
        status: 429,
        url: 'https://api.dexscreener.com',
        headers: {
          get: (name: string) => (name === 'Retry-After' ? '60' : null),
        },
      };

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.DEX_RATE_LIMIT);
      expect(result.userMessage).toContain('DEXscreener');
      expect(result.userMessage).toContain('60s');
      expect(result.retryAfterMs).toBe(60000);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('should handle 429 rate limit with OpenRouter', async () => {
      const error = new Error('Rate limited') as HTTPError;
      error.response = {
        status: 429,
        url: 'https://openrouter.ai/api',
        headers: {
          get: () => null,
        },
      };

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.LLM_RATE_LIMIT);
      expect(result.userMessage).toContain('OpenRouter');
      expect(result.suggestions).toContain('Consider using a less demanding model');
    });

    it('should handle 401 unauthorized', async () => {
      const error = new Error('Unauthorized') as HTTPError;
      error.response = {
        status: 401,
        url: 'https://openrouter.ai/api',
        headers: { get: () => null },
      };

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.LLM_UNAUTHORIZED);
      expect(result.userMessage).toContain('Invalid');
      expect(result.userMessage).toContain('OpenRouter');
      expect(result.suggestions).toContain('Click the extension icon and go to Settings');
    });

    it('should handle 403 forbidden', async () => {
      const error = new Error('Forbidden') as HTTPError;
      error.response = {
        status: 403,
        url: 'https://api.dexscreener.com',
        headers: { get: () => null },
      };

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.DEX_UNAUTHORIZED);
      expect(result.userMessage).toContain('DEXscreener');
    });

    it('should handle 400 bad request', async () => {
      const error = new Error('Bad request') as HTTPError;
      error.response = {
        status: 400,
        url: 'https://api.example.com',
        headers: { get: () => null },
      };

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.DEX_BAD_REQUEST);
      expect(result.userMessage).toContain('Invalid request');
      expect(result.suggestions).toBeDefined();
    });

    it('should handle 500 server errors', async () => {
      const error = new Error('Server error') as HTTPError;
      error.response = {
        status: 500,
        url: 'https://api.example.com',
        headers: { get: () => null },
      };

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.DEX_NETWORK_ERROR);
      expect(result.userMessage).toContain('Server error');
    });
  });

  describe('Timeout errors', () => {
    it('should handle TimeoutError for LLM', async () => {
      const error = new Error('Request timed out at openrouter.ai');
      error.name = 'TimeoutError';

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.LLM_TIMEOUT);
      expect(result.userMessage).toContain('LLM analysis');
      expect(result.suggestions).toContain(
        'Try a faster model (e.g., Claude Haiku instead of Sonnet)'
      );
    });

    it('should handle TimeoutError for DEX', async () => {
      const error = new Error('Request timed out');
      error.name = 'TimeoutError';

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.DEX_TIMEOUT);
      expect(result.userMessage).toContain('DEX data fetch');
    });

    it('should handle AbortError', async () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';

      const result = await handleApiError(error);

      // Should be treated as timeout
      expect([ERR.DEX_TIMEOUT, ERR.LLM_TIMEOUT]).toContain(result.code);
    });
  });

  describe('Network errors', () => {
    it('should handle TypeError fetch errors', async () => {
      const error = new TypeError('Failed to fetch');

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.NETWORK_ERROR);
      expect(result.userMessage).toContain('Network error');
      expect(result.suggestions).toContain('Check your internet connection');
    });
  });

  describe('Unknown errors', () => {
    it('should handle generic errors', async () => {
      const error = new Error('Something went wrong');

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.UNKNOWN);
      expect(result.userMessage).toContain('Unexpected error');
      expect(result.developerMessage).toBe('Something went wrong');
    });

    it('should handle non-Error objects', async () => {
      const error = 'string error';

      const result = await handleApiError(error);

      expect(result.code).toBe(ERR.UNKNOWN);
      expect(result.developerMessage).toBe('string error');
    });
  });
});
