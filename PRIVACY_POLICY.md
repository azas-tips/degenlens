# Privacy Policy for DegenLens

**Last Updated**: November 2025

## Introduction

DegenLens ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our Chrome extension.

## Information We Do NOT Collect

DegenLens is designed with privacy as a priority. We do NOT:

- Collect personal information
- Track your browsing history
- Store your analysis data on external servers
- Transmit user data to third parties
- Use cookies or tracking pixels
- Sell or share your information
- Monitor your trading activity
- Access your cryptocurrency wallets

## Information Stored Locally

DegenLens stores the following data **locally on your device only**:

### Chrome Storage (chrome.storage.local)
- **API Keys**: Your OpenRouter and DEXscreener API keys (encrypted by Chrome)
- **User Preferences**: Selected chain, model, and max pairs settings
- **Language Preference**: Your chosen language (English/Japanese)

### Session Storage (chrome.storage.session)
- **Cached Results**: Temporary cache of API responses (cleared when browser closes)
- **Rate Limiting Data**: Temporary counters to prevent API abuse

**Important**: All data stored locally is encrypted by Chrome and never leaves your device unless you explicitly make API requests.

## Third-Party Services

DegenLens connects to external APIs using **your own API keys**:

### 1. DEXscreener API
- **Purpose**: Fetch token pair data from decentralized exchanges
- **Data Sent**: Chain name, token addresses (no personal data)
- **Privacy Policy**: https://docs.dexscreener.com/privacy/privacy-policy
- **Your Control**: Optional API key (not required for basic usage)

### 2. OpenRouter API
- **Purpose**: AI-powered token analysis using LLM models
- **Data Sent**: Token metrics, analysis prompts (no personal data)
- **Privacy Policy**: https://openrouter.ai/privacy
- **Your Control**: Required API key (you create and manage)

### 3. LLM Providers (via OpenRouter)
- **Providers**: Anthropic (Claude), OpenAI (GPT), and others
- **Data Sent**: Token analysis prompts (public blockchain data only)
- **Privacy**: Governed by OpenRouter's and respective providers' policies
- **Your Control**: You choose which model to use

**Note**: DegenLens does not control these third-party services. Please review their privacy policies independently.

## Data Security

### Local Storage Security
- API keys are stored in Chrome's encrypted storage (`chrome.storage.local`)
- Session data is automatically cleared when the browser closes
- No data is transmitted to DegenLens servers (we don't have any servers)

### API Communication
- All API requests use HTTPS encryption
- Requests are made directly from your browser to API providers
- No intermediary servers are involved

### Best Practices
- Keep your API keys confidential
- Do not share screenshots containing API keys
- Regularly rotate your API keys
- Monitor your API usage on provider dashboards

## Your Rights and Choices

### Data Access
- All your data is stored locally on your device
- You can view stored data in Chrome DevTools → Application → Storage

### Data Deletion
- **API Keys**: Delete in extension Settings page
- **Preferences**: Reset in Settings or uninstall extension
- **Cache**: Clear browser data or use the cache clear button in extension

### Opt-Out
- You can stop using DegenLens at any time by disabling or uninstalling the extension
- Uninstalling removes all locally stored data

## Children's Privacy

DegenLens is not directed at children under 13. We do not knowingly collect information from children. If you are under 13, please do not use this extension.

## Cryptocurrency Trading Disclaimer

DegenLens provides data analysis tools for informational purposes only. We are not:
- Financial advisors
- Investment professionals
- Brokers or dealers
- Registered with any financial regulatory authority

**Always conduct your own research (DYOR) and consult qualified financial advisors before making investment decisions.**

## Open Source Transparency

DegenLens is open source. You can:
- Review the complete source code on GitHub
- Verify that we don't collect user data
- Audit API calls and data handling
- Contribute to the project

Repository: https://github.com/azas-tips/degenlens

## Changes to This Policy

We may update this Privacy Policy occasionally. Changes will be posted:
- In this document with an updated "Last Updated" date
- In the extension's GitHub repository
- In the Chrome Web Store listing (if material changes)

Continued use of DegenLens after changes constitutes acceptance of the updated policy.

## Analytics (Future Consideration)

Currently, DegenLens does not use any analytics. If we add privacy-respecting analytics in the future:
- We will update this policy first
- Only aggregate, anonymous data will be collected
- You will have the option to opt-out
- We will notify users via extension update notes

## Contact Us

Questions about this Privacy Policy or DegenLens privacy practices?

- **GitHub Issues**: https://github.com/azas-tips/degenlens/issues
- **GitHub Discussions**: https://github.com/azas-tips/degenlens/discussions

## Consent

By using DegenLens, you consent to this Privacy Policy.

## Compliance

### GDPR Compliance (EU Users)
- **Data Controller**: You (the user) control all data
- **Data Processor**: We are not a data processor (no server-side processing)
- **Right to Access**: All data is on your device
- **Right to Deletion**: Uninstall the extension
- **Right to Portability**: Export data from Chrome storage if needed

### CCPA Compliance (California Users)
- We do not sell personal information
- We do not share personal information for monetary benefit
- We do not collect personal information

### General Compliance
- We follow Chrome Web Store Developer Program Policies
- We adhere to Manifest V3 security and privacy standards
- We implement security best practices for extensions

## Limitation of Liability

DegenLens is provided "as is" without warranties. We are not liable for:
- Trading losses or investment decisions
- API provider service interruptions
- Data breaches at third-party services
- Errors or inaccuracies in token data or analysis

## Third-Party Links

This policy applies only to DegenLens. External links (DEXscreener, OpenRouter, etc.) are governed by their own privacy policies.

---

**Summary**: DegenLens respects your privacy. We don't collect, transmit, or store your personal data on external servers. All data remains on your device. You control your API keys and usage.

For questions or concerns, please contact us via GitHub or email.
