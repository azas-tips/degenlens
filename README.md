# 😈 DegenLens

AI-powered DEX scanner for smart degens. Analyze token pairs from decentralized exchanges using advanced LLM models.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/azas-tips/degenlens/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)](https://chrome.google.com/webstore)

🌐 **[Website](https://azas-tips.github.io/degenlens/)** | 📜 **[Privacy Policy](https://azas-tips.github.io/degenlens/privacy)** | 📋 **[Terms of Service](https://azas-tips.github.io/degenlens/terms)**

## Features

- 🔍 **Multi-Chain Support**: Solana, Ethereum, BSC, Polygon, Arbitrum, Optimism, Base
- 🤖 **AI-Powered Analysis**: Leverage Claude, GPT, and other LLMs via OpenRouter
- 📊 **Comprehensive Metrics**: Volume, liquidity, price changes, transaction patterns
- ⚡ **Real-Time Model Fetching**: Live model list from OpenRouter API
- 🌐 **Internationalization**: English and Japanese support
- 🎨 **Cyber/Neon Theme**: Modern dark UI with animated effects
- 💰 **Donation Support**: Built-in support for project contributions
- 📜 **Legal Pages**: Comprehensive Privacy Policy and Terms of Service
- ♿ **Accessibility**: Full keyboard navigation and screen reader support

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)
2. Click "Add to Chrome"
3. Click "Add Extension" to confirm

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/azas-tips/degenlens.git
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
2. Click "Settings" in the header
3. Enter your OpenRouter API key
4. (Optional) Enter your DEXscreener API key
5. Select your preferred language (English/Japanese)
6. (Optional) Customize the analysis prompt template
7. Click "Save Settings"

## Usage

### Basic Analysis

1. Click the DegenLens icon to open the dashboard
2. Select a blockchain network (e.g., Solana, Base, Ethereum)
3. Choose an LLM model from the dropdown:
   - **Claude Opus 4.1**: Flagship performance
   - **Claude Sonnet 4.5**: Best balance
   - **Claude Haiku 4.5**: Fast and economical
   - **GPT-5**: Strong alternative
   - **GPT-4o mini**: Budget-friendly option
   - *Models are fetched in real-time from OpenRouter*
4. Click "Analyze" or press `Ctrl/Cmd+Enter`
5. Wait for AI analysis (analyzes top 10 pairs automatically)

### Understanding Results

#### Top Pick
The AI selects the most promising token based on:
- **Momentum Score**: Current market momentum (0-100)
- **Catalyst**: Key factors driving price action
- **Moonshot Potential**: Upside potential assessment
- **Momentum Phase**: Current market cycle phase

#### Risk Assessment
- **Low**: Good liquidity, healthy volume, balanced patterns
- **Medium**: Moderate concerns, requires careful evaluation
- **High**: Low liquidity, suspicious patterns, or extreme volatility

#### Metrics
- **Price**: Current USD price
- **24h Change**: Price volatility percentage
- **Volume (6h)**: Recent trading activity
- **Liquidity**: Available funds for trading

### Keyboard Shortcuts

- `Ctrl/Cmd+Enter`: Start analysis
- `Esc`: Cancel ongoing analysis
- `Tab`: Navigate between elements

## Development

### Project Structure

```
degenlens/
├── src/
│   ├── api/              # API clients (DEXscreener, OpenRouter)
│   ├── app/              # Main dashboard UI
│   ├── background/       # Service worker and handlers
│   ├── components/       # Shared React components
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization
│   ├── shared/           # Shared utilities and schemas
│   ├── stores/           # Zustand state management
│   └── types/            # TypeScript type definitions
├── docs/                 # GitHub Pages (legal documents)
├── public/               # Static assets
└── dist/                 # Build output
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
- **Styling**: Tailwind CSS (Custom cyber/neon theme)
- **State Management**: Zustand
- **HTTP Client**: Ky
- **Validation**: Zod
- **Testing**: Vitest + Happy DOM
- **Linting**: ESLint + Prettier

## API Costs

DegenLens analyzes the **top 10 pairs** per request. Costs vary by model.

📋 **[View all models and pricing on OpenRouter →](https://openrouter.ai/models)** _(opens in new tab)_

### Latest Models (January 2025)

| Model | Provider | Input (per 1M) | Output (per 1M) | Est. Cost (10 pairs) |
|-------|----------|----------------|-----------------|----------------------|
| **Claude Opus 4.1** | Anthropic | $15.00 | $75.00 | ~$0.50 |
| **Claude Sonnet 4.5** | Anthropic | $3.00 | $15.00 | ~$0.10 |
| **Claude Haiku 4.5** | Anthropic | $1.00 | $5.00 | ~$0.03 |
| **GPT-5** | OpenAI | $1.25 | $10.00 | ~$0.06 |
| **GPT-4o** | OpenAI | $5.00 | $20.00 | ~$0.14 |
| **GPT-4o mini** | OpenAI | $0.15 | $0.60 | < $0.01 |
| **Gemini 2.5 Pro** | Google | $1.25 | $10.00 | ~$0.06 |
| **Gemini 2.5 Flash** | Google | $0.10 | $0.40 | < $0.01 |

*Costs are estimates with ~15% safety margin. Actual usage may vary based on token count.*

### Recommended Models

**🏆 Best Performance:**
- **Claude Opus 4.1** - Most capable reasoning (~$0.50/analysis)
- **GPT-5** - Strong general performance (~$0.06/analysis)

**⚡ Best Balance:**
- **Claude Sonnet 4.5** - Excellent quality/cost ratio (~$0.10/analysis)
- **Gemini 2.5 Pro** - Cost-effective alternative (~$0.06/analysis)

**💰 Best Economy:**
- **Claude Haiku 4.5** - 2× speed, ~95% Sonnet performance (~$0.03/analysis)
- **Gemini 2.5 Flash** - Ultra-low cost (< $0.01/analysis)
- **GPT-4o mini** - Reliable budget option (< $0.01/analysis)

**Cost Calculation:**
- Prompt tokens: ~300 tokens per pair (includes system prompt + pair data)
- Completion tokens: ~600 tokens per pair (LLM analysis output)
- Total per request: ~3,000 prompt + ~6,000 completion tokens

## Privacy & Security

- **Local Storage**: API keys encrypted in Chrome's secure storage
- **No Tracking**: DegenLens does not collect or transmit user data
- **No Servers**: All data processing happens locally in your browser
- **HTTPS Only**: All API requests use secure HTTPS connections
- **Open Source**: Fully auditable codebase

For details, see our [Privacy Policy](https://azas-tips.github.io/degenlens/privacy).

## Legal

- **Privacy Policy**: [https://azas-tips.github.io/degenlens/privacy](https://azas-tips.github.io/degenlens/privacy)
- **Terms of Service**: [https://azas-tips.github.io/degenlens/terms](https://azas-tips.github.io/degenlens/terms)
- **License**: MIT License (see [LICENSE](LICENSE))

## Limitations

- **Rate Limits**: API providers enforce rate limits. Monitor your usage.
- **Cost**: LLM analysis incurs costs. Track your OpenRouter spending.
- **Not Financial Advice**: DegenLens provides insights, not investment advice. Always DYOR (Do Your Own Research).
- **API Dependency**: Requires active internet connection and API availability.
- **Fixed Analysis**: Analyzes top 10 pairs per chain (not user-configurable).

## Troubleshooting

### "Invalid API key" Error
- Verify your OpenRouter API key in Settings
- Ensure you have credits in your OpenRouter account
- Check for typos or extra spaces

### "No models available" Warning
- Enter your OpenRouter API key in Settings
- Click "Retry" after adding the key
- Check your internet connection

### "Rate limit reached" Error
- Wait for the specified time before retrying
- Free models have strict rate limits
- Consider using a paid model for reliable performance

### "Request timed out" Error
- Check your internet connection
- Try a faster model (e.g., Claude Haiku)
- Retry the analysis

### Extension doesn't load
- Ensure you've completed the build process: `npm run build`
- Check the browser console for errors (F12)
- Try reloading the extension in `chrome://extensions/`

## Support

If you find DegenLens useful, consider supporting the project:

☕ **[Buy me a coffee](https://linqup.stream/s/70ed3496aed25440)** (via Linqup)

For issues and questions:
- **Issues**: [GitHub Issues](https://github.com/azas-tips/degenlens/issues)
- **Discussions**: [GitHub Discussions](https://github.com/azas-tips/degenlens/discussions)

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

## Roadmap

- [ ] Chrome Web Store publication
- [ ] Firefox extension support
- [ ] Chart integration for token pairs
- [ ] Watchlist feature
- [ ] Historical analysis comparison
- [ ] More chain support (Avalanche, Fantom, etc.)
- [ ] Multi-language legal documents (Japanese)

## Acknowledgments

- [DEXscreener](https://dexscreener.com) for DEX data API
- [OpenRouter](https://openrouter.ai) for unified LLM access
- [Anthropic](https://anthropic.com) for Claude models
- [OpenAI](https://openai.com) for GPT models
- [Linqup](https://linqup.stream) for donation platform

## Disclaimer

⚠️ **NOT FINANCIAL ADVICE**

DegenLens is a tool for informational purposes only. It does not provide financial, investment, or trading advice. Cryptocurrency trading involves substantial risk of loss. Always conduct your own research (DYOR) and consult with qualified financial advisors before making investment decisions.

**You are solely responsible for your investment decisions and any losses incurred.**

See our full [Terms of Service](https://azas-tips.github.io/degenlens/terms) for details.

---

Built with 💜 for the degen community.

**Version 1.0.0** | MIT License | [GitHub](https://github.com/azas-tips/degenlens)
