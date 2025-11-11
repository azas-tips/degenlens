// OpenRouter API Integration Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterModel,
} from '@/types/openrouter';

// Mock response holder
let mockJsonResponse: any = null;

// Mock ky
vi.mock('ky', () => {
  const mockJson = vi.fn(async () => mockJsonResponse);
  const mockGet = vi.fn(() => ({ json: mockJson }));
  const mockPost = vi.fn(() => ({ json: mockJson }));
  const mockCreate = vi.fn(() => ({
    get: mockGet,
    post: mockPost,
  }));

  return {
    default: {
      create: mockCreate,
    },
  };
});

// Mock cache
vi.mock('@/background/utils/cache', () => ({
  cacheManager: {
    getOrFetch: vi.fn(async (_key, fetchFn) => fetchFn()),
    delete: vi.fn(),
  },
  getModelsCacheKey: vi.fn(() => 'openrouter:models'),
}));

// Mock rate limiter
vi.mock('@/background/utils/rate-limiter', () => ({
  llmLimiter: {
    execute: vi.fn(async (fn) => fn()),
  },
}));

// Mock retry helper
vi.mock('@/background/utils/retry-helper', () => ({
  retryWithBackoff: vi.fn(async (fn) => fn()),
}));

// Mock chrome storage
global.chrome = {
  storage: {
    local: {
      get: vi.fn(async () => ({ openrouter_api_key: 'test-key' })),
      set: vi.fn(),
    },
    session: {
      get: vi.fn(async () => ({})),
      set: vi.fn(),
    },
  },
} as any;

describe('OpenRouter API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJsonResponse = null;
  });

  describe('fetchModels', () => {
    it('should fetch available models', async () => {
      const mockModels: OpenRouterModel[] = [
        {
          id: 'anthropic/claude-3.5-sonnet',
          name: 'Claude 3.5 Sonnet',
          context_length: 200000,
          created: Date.now() / 1000,
          pricing: {
            prompt: '0.000003',
            completion: '0.000015',
          },
        },
        {
          id: 'openai/gpt-4-turbo',
          name: 'GPT-4 Turbo',
          context_length: 128000,
          created: Date.now() / 1000,
          pricing: {
            prompt: '0.00001',
            completion: '0.00003',
          },
        },
      ];

      mockJsonResponse = { data: mockModels };

      const { fetchModels } = await import('../openrouter');
      const result = await fetchModels();

      expect(result).toEqual(mockModels);
      expect(result).toHaveLength(2);
    });

    it('should use cache', async () => {
      mockJsonResponse = { data: [] };

      const { cacheManager } = await import('@/background/utils/cache');
      const { fetchModels } = await import('../openrouter');

      await fetchModels();

      expect(cacheManager.getOrFetch).toHaveBeenCalled();
    });

    it('should throw error if API key is missing', async () => {
      global.chrome.storage.local.get = vi.fn(async () => ({}));

      const { fetchModels } = await import('../openrouter');

      await expect(fetchModels()).rejects.toThrow('OpenRouter API key not found');

      // Restore
      global.chrome.storage.local.get = vi.fn(async () => ({ openrouter_api_key: 'test-key' }));
    });
  });

  describe('chatCompletion', () => {
    it('should send chat completion request', async () => {
      const mockRequest: OpenRouterChatRequest = {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Analyze these tokens',
          },
        ],
      };

      const mockResponse: OpenRouterChatResponse = {
        id: 'chat-123',
        model: 'anthropic/claude-3.5-sonnet',
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Token analysis results...',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockJsonResponse = mockResponse;

      const { chatCompletion } = await import('../openrouter');
      const result = await chatCompletion(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(result.choices[0].message.content).toBe('Token analysis results...');
    });

    it('should log usage information', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockRequest: OpenRouterChatRequest = {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Test',
          },
        ],
      };

      const mockResponse: OpenRouterChatResponse = {
        id: 'chat-123',
        model: 'anthropic/claude-3.5-sonnet',
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockJsonResponse = mockResponse;

      const { chatCompletion } = await import('../openrouter');
      await chatCompletion(mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tokens used: 150')
      );

      consoleSpy.mockRestore();
    });

    it('should throw error if API key is missing', async () => {
      global.chrome.storage.local.get = vi.fn(async () => ({}));

      const mockRequest: OpenRouterChatRequest = {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Test',
          },
        ],
      };

      const { chatCompletion } = await import('../openrouter');

      await expect(chatCompletion(mockRequest)).rejects.toThrow(
        'OpenRouter API key not found'
      );

      // Restore
      global.chrome.storage.local.get = vi.fn(async () => ({ openrouter_api_key: 'test-key' }));
    });
  });

  describe('Cache management', () => {
    it('should clear models cache', async () => {
      const { cacheManager } = await import('@/background/utils/cache');
      const { clearModelsCache } = await import('../openrouter');

      await clearModelsCache();

      expect(cacheManager.delete).toHaveBeenCalledWith('openrouter:models');
    });
  });

  describe('Rate limiting', () => {
    it('should use rate limiter for fetchModels', async () => {
      mockJsonResponse = { data: [] };

      const { llmLimiter } = await import('@/background/utils/rate-limiter');
      const { fetchModels } = await import('../openrouter');

      await fetchModels();

      expect(llmLimiter.execute).toHaveBeenCalled();
    });

    it('should use rate limiter for chatCompletion', async () => {
      const mockRequest: OpenRouterChatRequest = {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Test',
          },
        ],
      };

      const mockResponse: OpenRouterChatResponse = {
        id: 'chat-123',
        model: 'anthropic/claude-3.5-sonnet',
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockJsonResponse = mockResponse;

      const { llmLimiter } = await import('@/background/utils/rate-limiter');
      const { chatCompletion } = await import('../openrouter');

      await chatCompletion(mockRequest);

      expect(llmLimiter.execute).toHaveBeenCalled();
    });
  });
});
