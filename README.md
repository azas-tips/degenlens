# DegenLens

AI-powered DEX scanner for smart degens. Analyze token pairs from decentralized exchanges using advanced LLM models.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/azas-tips/degenlens/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)](https://chrome.google.com/webstore)

🌐 **[Website](https://azas-tips.github.io/degenlens/)** | 📜 **[Privacy Policy](https://azas-tips.github.io/degenlens/privacy)** | 📋 **[Terms of Service](https://azas-tips.github.io/degenlens/terms)**

## Features

- 🔍 **Multi-Chain Support**: Solana, Ethereum, BSC, Polygon, Arbitrum, Optimism, Base
- 🤖 **AI-Powered Analysis**: Leverage Claude, GPT, and other LLMs via OpenRouter
- 🆓 **Free Local AI Option**: Chrome Built-in AI (Gemini Nano) - no API key required (Chrome 140+)
- 📊 **Comprehensive Metrics**: Volume, liquidity, price changes, transaction patterns
- ⚡ **Real-Time Model Fetching**: Live model list from OpenRouter API with max input token display
- 🚫 **Token Exclusion**: Exclude unwanted tokens from future analysis
- 🎯 **Risk Assessment**: Multi-factor risk scoring (age, liquidity, labels, volume, volatility, activity) with visual gauge and detailed breakdown
- 📱 **Flexible Layout**: Switch between single-column and split-view layouts
- 🌐 **Internationalization**: English and Japanese support
- 🎨 **Cyber/Neon Theme**: Modern dark UI with animated effects
- 💰 **Donation Support**: Built-in support for project contributions
- 📜 **Legal Pages**: Comprehensive Privacy Policy and Terms of Service
- ♿ **Accessibility**: Full keyboard navigation and screen reader support

## Installation

### From Chrome Web Store
1. Visit the <a href="https://chrome.google.com/webstore" target="_blank">Chrome Web Store</a> (coming soon)
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

### Choose Your AI Model

DegenLens offers two options for AI analysis:

#### Option 1: Chrome Built-in AI (Gemini Nano) - FREE
**No setup required!** If you have Chrome 140+, Gemini Nano is available for free local analysis.

**System Requirements:**
- Chrome 140+
- 22GB+ free storage space
- GPU: 4GB+ VRAM or CPU: 16GB+ RAM with 4+ cores
- Unlimited or non-metered network connection
- Not supported on mobile devices

**How to use:**
1. Simply select "Gemini Nano (Built-in, Free)" from the model dropdown
2. If available, it will show "✓ Ready" status
3. If not downloaded yet, Chrome will prompt you to download the model

#### Option 2: OpenRouter (Recommended for Advanced Features)
OpenRouter provides access to multiple powerful LLM providers with a single API key.

1. Visit <a href="https://openrouter.ai" target="_blank">OpenRouter</a>
2. Sign up and navigate to <a href="https://openrouter.ai/keys" target="_blank">Keys</a>
3. Create a new API key
4. Add credits to your account

### 2. Configure Extension

1. Click the DegenLens icon in your browser toolbar
2. Click "Settings" in the header
3. Enter your OpenRouter API key
4. Select your preferred language (English/Japanese)
5. (Optional) Customize the analysis prompt template
6. Click "Save Settings"

## Usage

### Basic Analysis

1. Click the DegenLens icon to open the dashboard
2. Select a blockchain network (e.g., Solana, Base, Ethereum)
3. Choose an LLM model from the dropdown:
   - **Gemini Nano (Built-in, Free)**: Chrome's local AI - no API key required (Chrome 140+)
   - **Claude Opus 4.1**: Flagship performance (OpenRouter)
   - **Claude Sonnet 4.5**: Best balance (OpenRouter)
   - **Claude Haiku 4.5**: Fast and economical (OpenRouter)
   - **GPT-5**: Strong alternative (OpenRouter)
   - **GPT-4o mini**: Budget-friendly option (OpenRouter)
   - *OpenRouter models are fetched in real-time*
   - *Max Input Tokens shown for each model (calculated as context_length - max_completion_tokens)*
4. Adjust the number of pairs to analyze (1-100, default: 20)
5. Click "Analyze" or press `Ctrl/Cmd+Enter`
6. Wait for AI analysis

### Understanding Results

#### Top Pick
The AI selects the most promising token based on:
- **Momentum Score**: Current market momentum (0-100)
- **Catalyst**: Key factors driving price action
- **Moonshot Potential**: Upside potential assessment
- **Momentum Phase**: Current market cycle phase
- **Social Links**: Direct access to project's website and social media (Twitter, Telegram, Discord)

#### Risk Assessment
DegenLens provides multi-factor risk scoring (0-135 points):

- **Safe (0-19)**: Low risk - established token with good fundamentals
- **Caution (20-39)**: Moderate risk - proceed with research
- **Warning (40-59)**: High risk - exercise caution
- **Danger (60-79)**: Very high risk - not recommended
- **Critical (80+)**: Extreme risk - AVOID

**Risk Factors Analyzed:**
- **Age** (0-30 points): Contract/pair creation date
- **Liquidity** (0-30 points): Available liquidity and liquidity/market cap ratio
- **Labels** (0-40 points): DEXscreener labels (scam detection, verification status)
- **Volume** (0-20 points): 24-hour trading volume
- **Volatility** (0-15 points): Short-term price volatility (5m, 1h changes)
- **Activity** (0-20 points): Trading activity (5-minute and 24-hour transaction counts)

**Visual Indicators:**
- Risk gauge with color-coded severity
- Detailed breakdown showing contribution of each factor
- Reason explanations for each risk component

#### Metrics
- **Price**: Current USD price
- **24h Change**: Price volatility percentage
- **Volume (6h)**: Recent trading activity
- **Liquidity**: Available funds for trading

### Token Exclusion

Exclude tokens you're not interested in from future analysis:

1. After analysis, find the "Exclude" button (🚫) next to the contract address
2. Click "Exclude" and confirm
3. The token will be filtered out from all future analyses across all chains
4. Manage excluded tokens in Settings > Exclusion List

**How it works:**
- Exclusion is based on the base token address (not the pair)
- Example: Excluding "BONK" will filter all BONK pairs (BONK/SOL, BONK/USDC, etc.)
- Excluded tokens are stored locally and persist across sessions

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

DegenLens analyzes **1-100 pairs** per request (default: 20). Costs vary by model and number of pairs.

### Free Option
- **Gemini Nano (Chrome Built-in AI)**: Completely FREE - runs locally on your device (Chrome 140+ required)

### Paid Options (OpenRouter)

📋 **<a href="https://openrouter.ai/models" target="_blank">View all models and pricing on OpenRouter →</a>**

#### Latest Models (November 2025)

| Model | Provider | Input (per 1M) | Output (per 1M) | Est. Cost (20 pairs) |
|-------|----------|----------------|-----------------|----------------------|
| **Claude Opus 4.1** | Anthropic | $15.00 | $75.00 | ~$1.00 |
| **Claude Sonnet 4.5** | Anthropic | $3.00 | $15.00 | ~$0.20 |
| **Claude Haiku 4.5** | Anthropic | $1.00 | $5.00 | ~$0.06 |
| **GPT-5** | OpenAI | $1.25 | $10.00 | ~$0.12 |
| **GPT-4o** | OpenAI | $5.00 | $20.00 | ~$0.28 |
| **GPT-4o mini** | OpenAI | $0.15 | $0.60 | < $0.01 |
| **Gemini 2.5 Pro** | Google | $1.25 | $10.00 | ~$0.12 |
| **Gemini 2.5 Flash** | Google | $0.10 | $0.40 | < $0.01 |

*Costs are estimates with ~15% safety margin for 20 pairs. Actual usage may vary based on token count and number of pairs analyzed.*

### Recommended Models

**🏆 Best Performance:**
- **Claude Opus 4.1** - Most capable reasoning (~$1.00 per 20 pairs)
- **GPT-5** - Strong general performance (~$0.12 per 20 pairs)

**⚡ Best Balance:**
- **Claude Sonnet 4.5** - Excellent quality/cost ratio (~$0.20 per 20 pairs)
- **Gemini 2.5 Pro** - Cost-effective alternative (~$0.12 per 20 pairs)

**💰 Best Economy:**
- **Claude Haiku 4.5** - 2× speed, ~95% Sonnet performance (~$0.06 per 20 pairs)
- **Gemini 2.5 Flash** - Ultra-low cost (< $0.01 per 20 pairs)
- **GPT-4o mini** - Reliable budget option (< $0.01 per 20 pairs)

**Cost Calculation:**
- Prompt tokens: ~300 tokens per pair (includes system prompt + pair data)
- Completion tokens: ~600 tokens per pair (LLM analysis output)
- Total for 20 pairs: ~6,000 prompt + ~12,000 completion tokens
- Adjust proportionally for different pair counts (1-100 pairs)

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
- **Cost**: OpenRouter LLM analysis incurs costs. Track your OpenRouter spending (varies by pair count). Gemini Nano is free but requires Chrome 140+ and significant storage/RAM.
- **Gemini Nano Requirements**: Requires Chrome 140+, 22GB+ storage, 4GB+ VRAM or 16GB+ RAM. Not available on mobile devices.
- **Not Financial Advice**: DegenLens provides insights, not investment advice. Always DYOR (Do Your Own Research).
- **API Dependency**: OpenRouter models require active internet connection. Gemini Nano runs locally after initial download.
- **Token Limit Awareness**: Large pair counts may exceed model input limits. The extension shows max input tokens for each model.

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

### Gemini Nano not available
- Ensure you're using Chrome 140 or later (`chrome://version`)
- Check system requirements: 22GB+ storage, 4GB+ VRAM or 16GB+ RAM
- Gemini Nano is not supported on mobile devices
- Try using an OpenRouter model instead

### Gemini Nano shows "Download Required"
- Click the model and Chrome will prompt to download Gemini Nano
- Ensure you have 22GB+ free storage space
- Download requires unlimited or non-metered network connection
- Download may take some time depending on your connection speed

## Support

If you find DegenLens useful, consider supporting the project:

☕ **<a href="https://linqup.stream/s/70ed3496aed25440" target="_blank">Buy me a coffee</a>** (via Linqup)

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

## Acknowledgments

- <a href="https://dexscreener.com" target="_blank">DEXscreener</a> for DEX data API
- <a href="https://openrouter.ai" target="_blank">OpenRouter</a> for unified LLM access
- <a href="https://anthropic.com" target="_blank">Anthropic</a> for Claude models
- <a href="https://openai.com" target="_blank">OpenAI</a> for GPT models
- <a href="https://linqup.stream" target="_blank">Linqup</a> for donation platform

## Disclaimer

⚠️ **NOT FINANCIAL ADVICE**

DegenLens is a tool for informational purposes only. It does not provide financial, investment, or trading advice. Cryptocurrency trading involves substantial risk of loss. Always conduct your own research (DYOR) and consult with qualified financial advisors before making investment decisions.

**You are solely responsible for your investment decisions and any losses incurred.**

See our full [Terms of Service](https://azas-tips.github.io/degenlens/terms) for details.

---

Built with 💜 for the degen community.

**Version 1.0.0** | MIT License | [GitHub](https://github.com/azas-tips/degenlens)
