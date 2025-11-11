// OpenRouter API Type Definitions
// Based on official API documentation

// Model Information
export interface OpenRouterModelPricing {
  prompt: string; // 1トークンあたりの料金（USD）
  completion: string; // 1トークンあたりの料金（USD）
  request?: string; // リクエストごとの固定料金
  image?: string; // 画像処理の料金
  audio?: string; // 音声処理の料金
  web_search?: string; // ウェブ検索機能の料金
  input_cache_read?: string; // キャッシュ読み取り料金
  input_cache_write?: string; // キャッシュ書き込み料金
}

export interface OpenRouterModelArchitecture {
  modality?: string; // "text->text", "text+image->text" など
  tokenizer?: string; // トークナイザー名
  instruct_type?: string; // 指示形式
}

export interface OpenRouterModel {
  id: string; // モデルID（例: "anthropic/claude-4.5-sonnet"）
  name: string; // 表示名
  description?: string; // モデルの説明
  context_length: number; // 最大コンテキスト長
  created: number; // Unix タイムスタンプ
  architecture?: OpenRouterModelArchitecture;
  pricing: OpenRouterModelPricing;
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// Chat Completion Request
export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number; // 0-2, デフォルト: 1
  top_p?: number; // 0-1
  max_tokens?: number;
  frequency_penalty?: number; // -2 to 2
  presence_penalty?: number; // -2 to 2
  stop?: string | string[];
  stream?: boolean;
  // 使用量追跡を有効化（レスポンスボディに含める）
  usage?: {
    include: boolean;
  };
}

// Chat Completion Response
export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChoice {
  index: number;
  message: OpenRouterMessage;
  finish_reason: "stop" | "length" | "content_filter" | null;
}

export interface OpenRouterChatResponse {
  id: string;
  model: string;
  created: number;
  object: "chat.completion";
  choices: OpenRouterChoice[];
  usage?: OpenRouterUsage;
}

// Error Response
export interface OpenRouterErrorResponse {
  error: {
    message: string;
    type?: string;
    code?: string | number;
  };
}

// API仕様メモ:
// - 認証: Authorization: Bearer <API_KEY>
// - オプションヘッダー:
//   - HTTP-Referer: アプリのURL（アトリビューション用）
//   - X-Title: アプリ名（アトリビューション用）
// - レート制限: モデルごとに異なる（ドキュメント要確認）
// - 使用量追跡:
//   - リクエストに usage: {include: true} を含める
//   - レスポンスボディの usage フィールドで確認
//   - レスポンスヘッダーでも提供される可能性あり（要確認）
// - エンドポイント:
//   GET /api/v1/models - モデル一覧取得
//   POST /api/v1/chat/completions - チャット補完
