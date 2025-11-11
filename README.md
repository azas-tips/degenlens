# 😈 DegenLens

AI-powered DEX scanner for smart degens. Analyze token pairs from decentralized exchanges using advanced LLM models.

## Features

- 🔍 **Multi-Chain Support**: Solana, Ethereum, BSC, Polygon, Arbitrum, Optimism, Base
- 🤖 **AI-Powered Analysis**: Leverage Claude, OpenAI, and other LLMs via OpenRouter
- 📊 **Comprehensive Metrics**: Volume, liquidity, price changes, transaction patterns
- ⚡ **Smart Caching**: Reduces API calls and improves response time
- 🔄 **Automatic Retries**: Exponential backoff for network resilience
- 🌐 **Internationalization**: English and Japanese support
- ♿ **Accessibility**: Full keyboard navigation and screen reader support
- 🎨 **Modern UI**: Dark mode, loading skeletons, real-time progress indicators

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](#) (coming soon)
2. Click "Add to Chrome"
3. Click "Add Extension" to confirm

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/degenlens.git
   cd degenlens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Setup

### 1. Get API Keys

#### OpenRouter (Required)
OpenRouter provides access to multiple LLM providers with a single API key.

1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up and navigate to [Keys](https://openrouter.ai/keys)
3. Create a new API key
4. Add credits to your account

#### DEXscreener (Optional)
DEXscreener API key increases rate limits but is not required for basic usage.

1. Visit [DEXscreener](https://dexscreener.com)
2. Check their documentation for API key requirements

### 2. Configure Extension

1. Click the DegenLens icon in your browser toolbar
2. Click "Settings" (or right-click → Options)
3. Enter your OpenRouter API key
4. (Optional) Enter your DEXscreener API key
5. Click "Save Settings"

## Usage

### Basic Analysis

1. Click the DegenLens icon to open the popup
2. Select a blockchain network (e.g., Solana)
3. Choose an LLM model:
   - **Claude 3.5 Sonnet**: Best quality, higher cost
   - **Claude 3 Haiku**: Fast and economical
   - **GPT-4 Turbo**: Alternative high-quality option
   - **GPT-3.5 Turbo**: Budget-friendly option
4. Adjust "Max Pairs" slider (1-100)
5. Click "Analyze" or press `Ctrl/Cmd+Enter`

### Understanding Results

#### Risk Assessment
- **Low**: Good liquidity, healthy volume, balanced buy/sell ratio
- **Medium**: Moderate concerns, requires careful evaluation
- **High**: Low liquidity, suspicious patterns, or extreme volatility

#### Score (1-10)
- **8-10**: Strong fundamentals, worth monitoring
- **5-7**: Average quality, proceed with caution
- **1-4**: High risk, significant concerns

#### Metrics
- **24h Volume**: Trading activity indicator
- **Liquidity**: Available funds for trading
- **24h Change**: Price volatility
- **Transactions**: Buy/sell activity patterns

### Keyboard Shortcuts

- `Ctrl/Cmd+Enter`: Start/Cancel analysis
- `Esc`: Cancel ongoing analysis
- `Tab`: Navigate between form elements

## Development

### Project Structure

```
degenlens/
├── src/
│   ├── api/              # API clients (DEXscreener, OpenRouter)
│   ├── background/       # Service worker and handlers
│   ├── i18n/            # Internationalization
│   ├── options/         # Settings page
│   ├── popup/           # Main UI
│   ├── shared/          # Shared utilities
│   └── types/           # TypeScript types
├── public/              # Static assets
└── dist/                # Build output
```

### Build Commands

```bash
# Development (watch mode with HMR)
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Testing
npm run test
npm run test:ui  # Open Vitest UI
```

### Pre-commit Checklist

Before committing changes, ensure:

1. Type checking passes: `npm run typecheck`
2. Linting passes: `npm run lint`
3. Code is formatted: `npm run format`
4. Tests pass: `npm run test`

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite + CRXJS (Chrome Extension Plugin)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Ky
- **Validation**: Zod
- **Testing**: Vitest + Happy DOM
- **Linting**: ESLint + Prettier

## API Costs

DegenLens uses OpenRouter for LLM analysis. Costs vary by model:

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Typical Cost (20 pairs) |
|-------|----------------------|------------------------|--------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 | ~$0.08 |
| Claude 3 Haiku | $0.25 | $1.25 | ~$0.01 |
| GPT-4 Turbo | $10.00 | $30.00 | ~$0.25 |
| GPT-3.5 Turbo | $0.50 | $1.50 | ~$0.02 |

*Costs are estimates. Actual usage may vary.*

## Privacy & Security

- **Local Storage**: API keys are stored locally in Chrome's secure storage
- **No Tracking**: DegenLens does not collect or transmit user data
- **Cache**: Analysis results are cached in session storage and cleared when the browser closes
- **HTTPS Only**: All API requests use secure HTTPS connections

## Limitations

- **Rate Limits**: API providers enforce rate limits. Use cache and adjust analysis frequency.
- **Cost**: LLM analysis incurs costs. Monitor your OpenRouter usage.
- **Not Financial Advice**: DegenLens provides data-driven insights, not investment advice. Always DYOR (Do Your Own Research).
- **API Dependency**: Requires active internet connection and API availability.

## Troubleshooting

### "Invalid API key" Error
- Verify your OpenRouter API key in Settings
- Ensure you have credits in your OpenRouter account
- Check for typos or extra spaces

### "Rate limit reached" Error
- Wait for the specified time before retrying
- Reduce the number of pairs to analyze
- Use cache refresh button to avoid redundant requests

### "Request timed out" Error
- Check your internet connection
- Try a faster model (e.g., Claude Haiku)
- Reduce the number of pairs to analyze

### Extensio doesn't load
- Ensure you've completed the build process
- Check the browser console for errors
- Try reloading the extension in `chrome://extensions/`

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following our commit conventions
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
type(scope): description

feat(api): Add retry logic for API failures
fix(ui): Correct button alignment issue
docs(readme): Update installation instructions
test(utils): Add tests for rate limiter
```

## License

MIT License - see LICENSE file for details.

## Disclaimer

⚠️ **NOT FINANCIAL ADVICE**

DegenLens is a tool for informational purposes only. It does not provide financial, investment, or trading advice. Cryptocurrency trading involves substantial risk of loss. Always conduct your own research (DYOR) and consult with qualified financial advisors before making investment decisions.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/degenlens/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/degenlens/discussions)
- **Email**: support@degenlens.example

## Acknowledgments

- [DEXscreener](https://dexscreener.com) for DEX data API
- [OpenRouter](https://openrouter.ai) for unified LLM access
- [Anthropic](https://anthropic.com) for Claude models
- [OpenAI](https://openai.com) for GPT models

---

Built with 💜 for the degen community.
