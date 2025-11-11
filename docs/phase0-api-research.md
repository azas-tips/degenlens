# Phase 0: API調査結果レポート

調査日: 2025-11-12
ブランチ: `feature/phase0-api-research`

---

## 📋 調査概要

DegenLens開発のPhase 0として、以下の2つのAPIについて詳細な調査を実施しました：

1. **DEXscreener API** - DEXトークンペア情報の取得
2. **OpenRouter API** - LLMモデルへのアクセス

---

## 🔍 DEXscreener API調査結果

### 基本情報

| 項目 | 内容 |
|------|------|
| **ベースURL** | `https://api.dexscreener.com` |
| **認証方式** | 不明（ドキュメントに記載なし、公開APIの可能性） |
| **レート制限** | 300リクエスト/分 |
| **ドキュメント** | https://docs.dexscreener.com/api/reference |

### 重要な発見

#### ⚠️ Pagination サポートなし
- **`limit`、`offset`パラメータはサポートされていない**
- 公式APIでは、ペア一覧をページング取得する方法が提供されていない
- 代替手段:
  - トークンアドレスを指定してペア取得
  - 検索クエリでフィルタリング
  - 最大30件のトークンアドレスをカンマ区切りで指定可能

#### 利用可能なエンドポイント

```
GET /latest/dex/pairs/{chainId}/{pairId}
- 特定のペア情報を取得
- chainId: "solana", "ethereum", "bsc" など
- pairId: ペアアドレス

GET /latest/dex/search?q={query}
- クエリ文字列でペアを検索
- 自由検索が可能

GET /token-pairs/v1/{chainId}/{tokenAddress}
- 特定トークンのペア一覧を取得
- 最も実用的なエンドポイント

GET /tokens/v1/{chainId}/{tokenAddresses}
- 複数トークンの情報を取得
- 最大30件のアドレスをカンマ区切りで指定
```

### レスポンス構造

```typescript
{
  "schemaVersion": "1.0.0",
  "pairs": [
    {
      "chainId": "solana",
      "dexId": "raydium",
      "pairAddress": "...",
      "baseToken": {
        "address": "...",
        "name": "Token Name",
        "symbol": "TOKEN"
      },
      "quoteToken": {...},
      "priceUsd": "100.23",
      "priceNative": "...",
      "liquidity": {
        "usd": 1000000,
        "base": 10000,
        "quote": 5000
      },
      "volume": {
        "h24": 500000,
        "h6": 150000,
        "h1": 50000,
        "m5": 5000
      },
      "priceChange": {
        "h24": 5.5,
        "h6": 2.3,
        "h1": 1.2,
        "m5": 0.5
      },
      "txns": {
        "h24": { "buys": 100, "sells": 80 }
      }
    }
  ]
}
```

### エラーレスポンス

**ドキュメントに明記なし**。実装時に以下を想定：

```typescript
{
  "error": "エラーメッセージ",
  "statusCode": 404
}
```

### 実装上の推奨事項

1. **トークンアドレスベースの取得を採用**
   - `/token-pairs/v1/{chainId}/{tokenAddress}` を使用
   - 人気トークンのリストを事前定義
   - または検索エンドポイントで動的取得

2. **キャッシュの活用**
   - 300req/分の制限を考慮
   - `chrome.storage.session` で60秒キャッシュ

3. **エラーハンドリング**
   - 429（レート制限）に対応
   - `Retry-After` ヘッダーの確認
   - 指数バックオフ実装

---

## 🤖 OpenRouter API調査結果

### 基本情報

| 項目 | 内容 |
|------|------|
| **ベースURL** | `https://openrouter.ai/api/v1` |
| **認証方式** | Bearer Token (`Authorization: Bearer <API_KEY>`) |
| **レート制限** | モデルごとに異なる（要確認） |
| **ドキュメント** | https://openrouter.ai/docs/quickstart |

### リクエストヘッダー

#### 必須

```
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json
```

#### オプション（アトリビューション用）

```
HTTP-Referer: https://github.com/your-repo/degenlens
X-Title: DegenLens
```

**Note**: これらのヘッダーを含めると、OpenRouterのランキングに表示される。

### 主要エンドポイント

#### 1. モデル一覧取得

```
GET /api/v1/models
```

**レスポンス例**:

```typescript
{
  "data": [
    {
      "id": "anthropic/claude-4.5-sonnet",
      "name": "Claude 4.5 Sonnet",
      "description": "最高のコーディング性能",
      "context_length": 200000,
      "created": 1234567890,
      "pricing": {
        "prompt": "0.000003",      // $3/1M tokens
        "completion": "0.000015",   // $15/1M tokens
        "request": "0",
        "image": "0"
      },
      "architecture": {
        "modality": "text->text",
        "tokenizer": "Claude",
        "instruct_type": "claude"
      }
    }
  ]
}
```

#### 2. チャット補完

```
POST /api/v1/chat/completions
```

**リクエスト例**:

```typescript
{
  "model": "anthropic/claude-4.5-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "Solanaチェーンのトップ20ペアを分析して"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 4000,
  "usage": {
    "include": true  // 使用量をレスポンスに含める
  }
}
```

**レスポンス例**:

```typescript
{
  "id": "gen-...",
  "model": "anthropic/claude-4.5-sonnet",
  "created": 1234567890,
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "分析結果..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 800,
    "total_tokens": 950
  }
}
```

### 使用量追跡

**重要**: 使用量を取得するには、リクエストに以下を含める必要があります：

```typescript
{
  "usage": {
    "include": true
  }
}
```

これにより、レスポンスボディの `usage` フィールドでトークン数を確認できます。

### 価格計算例

```typescript
// Claude 4.5 Sonnet の場合
const inputTokens = 150;
const outputTokens = 800;

const inputCost = inputTokens * 0.000003;   // $0.00045
const outputCost = outputTokens * 0.000015;  // $0.012
const totalCost = inputCost + outputCost;    // $0.01245
```

### エラーレスポンス

```typescript
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": 401
  }
}
```

**主なエラーコード**:
- `401`: APIキーが無効
- `429`: レート制限超過
- `400`: リクエストが不正
- `500`: サーバーエラー

### 実装上の推奨事項

1. **タイムアウト設定**
   - LLMレスポンスは時間がかかるため、30秒のタイムアウトを設定
   - AbortControllerを使用

2. **Port通信の使用**
   - Service Workerの寿命問題を回避
   - 長時間処理中もバックグラウンドが生き続ける

3. **エラーハンドリング**
   - 401/403: Options画面を開いてAPIキー再設定を促す
   - 429: `Retry-After` ヘッダーを確認し待機
   - タイムアウト: リトライボタンを表示

4. **コスト制御**
   - ユーザーが分析ペア数を調整できるスライダー（1-100）
   - プロンプトをコンテキスト長の85%以内に制限

---

## 📊 実装への影響

### 1. DEXscreenerのlimit/offset問題

**問題**: ペア一覧のページング取得が不可能

**解決策**:
- 検索エンドポイントを活用
- 特定のチェーンで「人気トークン」を事前定義
- `/latest/dex/search` で動的に取得
- トークンアドレスベースでペアを取得

**実装例**:

```typescript
// 人気トークンのリスト（Solanaの例）
const POPULAR_TOKENS = [
  'So11111111111111111111111111111111111111112', // Wrapped SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  // ... 他のトークン
];

// 各トークンのペアを取得
for (const tokenAddress of POPULAR_TOKENS) {
  const response = await fetch(
    `https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddress}`
  );
  const data = await response.json();
  // ペア情報を取得・処理
}
```

### 2. OpenRouterのモデル選択

**実装方針**:
- 起動時に `/api/v1/models` から動的にモデル一覧を取得
- `chrome.storage.session` に30分キャッシュ
- フォールバックモデルリストを用意（API失敗時）

```typescript
const FALLBACK_MODELS = [
  { id: 'anthropic/claude-4.5-sonnet', name: 'Claude 4.5 Sonnet' },
  { id: 'openai/gpt-5', name: 'GPT-5' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast' }
];
```

### 3. コスト推定の表示

```typescript
// モデル選択時に推定コストを表示
const estimatedTokens = pairs.length * 100; // 概算
const model = selectedModel;
const estimatedCost =
  (estimatedTokens * parseFloat(model.pricing.prompt)) +
  (estimatedTokens * parseFloat(model.pricing.completion));

console.log(`推定コスト: $${estimatedCost.toFixed(4)}`);
```

---

## ✅ Phase 0 完了チェックリスト

- [x] DEXscreener API仕様を調査（認証方式、ヘッダー名、レート制限）
- [x] DEXscreener APIエンドポイントを確認（チェーン一覧、ペア取得）
- [x] DEXscreener APIレスポンス形式のTypeScript型定義を作成
- [x] OpenRouter API仕様を調査（/api/v1/models、コスト情報、使用量ヘッダー）
- [x] OpenRouter APIレスポンス形式のTypeScript型定義を作成
- [x] Phase 0調査結果をドキュメントにまとめる

---

## 📁 成果物

1. **型定義ファイル**
   - `src/types/dexscreener.ts`
   - `src/types/openrouter.ts`

2. **調査ドキュメント**
   - `docs/phase0-api-research.md`（本ファイル）

---

## 🚀 次のステップ（Week 1: Day 3-4）

Phase 0 が完了したので、次は**開発環境構築**に進みます：

1. Vite + `@crxjs/vite-plugin` のセットアップ
2. TypeScript、Tailwind CSS、ESLint/Prettier の設定
3. manifest.json の作成
4. プロジェクト構造の構築

---

**調査担当**: Claude Code
**最終更新**: 2025-11-12
