// Test script to verify prompt generation with real data
// This tests the prompt generation for LLM analysis

import { fetchPairsByChain } from '../src/api/dexscreener';
import { buildAnalysisPrompt } from '../src/background/utils/prompt-builder';
import type { Timeframe } from '../src/types/dexscreener';

// Mock chrome API for Node.js environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
(global as any).chrome = {
  storage: {
    local: {
      get: async () => ({}), // Return empty object (no API key)
      set: async () => {},
      remove: async () => {},
      clear: async () => {},
    },
    session: {
      get: async () => ({}),
      set: async () => {},
      remove: async () => {},
      clear: async () => {},
    },
  },
  runtime: {
    connect: () => ({}),
  },
};

async function testPromptGeneration() {
  console.log('=== Testing Prompt Generation ===');
  console.log('Chain: Solana');
  console.log('Timeframe: 5 minutes (m5)');
  console.log('Max Pairs: 20');
  console.log('Language: English');
  console.log('\n--- Fetching data from DEXscreener... ---\n');

  try {
    const timeframe: Timeframe = 'm5';
    const pairs = await fetchPairsByChain('solana', 20, timeframe);

    console.log(`✓ Fetched ${pairs.length} pairs\n`);

    if (pairs.length === 0) {
      console.log('❌ No pairs returned from API');
      return;
    }

    // Show summary of fetched pairs
    console.log('--- Top 5 Pairs Summary ---');
    pairs.slice(0, 5).forEach((pair, i) => {
      console.log(`\n${i + 1}. ${pair.baseToken?.symbol}/${pair.quoteToken?.symbol}`);
      console.log(`   Price: $${pair.priceUsd}`);
      console.log(`   Volume (5m): $${pair.volume?.m5?.toLocaleString() || 'N/A'}`);
      console.log(`   Liquidity: $${pair.liquidity?.usd?.toLocaleString() || 'N/A'}`);
      console.log(`   Price Change (5m): ${pair.priceChange?.m5 ? `${pair.priceChange.m5.toFixed(2)}%` : 'N/A'}`);
      console.log(`   Txns (5m): ${pair.txns?.m5?.buys || 0} buys / ${pair.txns?.m5?.sells || 0} sells`);
      console.log(`   Market Cap: $${pair.marketCap?.toLocaleString() || 'N/A'}`);
      console.log(`   FDV: $${pair.fdv?.toLocaleString() || 'N/A'}`);
      console.log(`   Pair Age: ${pair.pairCreatedAt ? formatAge(pair.pairCreatedAt) : 'Unknown'}`);
      console.log(`   Labels: ${pair.labels?.join(', ') || 'None'}`);
      console.log(`   DEX: ${pair.dexId || 'Unknown'}`);
    });

    console.log('\n--- Generating Prompt... ---\n');

    const prompt = buildAnalysisPrompt(pairs, 'solana', timeframe, undefined, 'en');

    console.log('✓ Prompt generated successfully\n');
    console.log('--- Prompt Metrics ---');
    console.log(`Total characters: ${prompt.length}`);
    console.log(`Total lines: ${prompt.split('\n').length}`);
    console.log(`Estimated tokens: ~${Math.ceil(prompt.length / 4)}`);

    console.log('\n--- Prompt Structure Validation ---');
    const checks = [
      { name: 'Contains pairs data', test: prompt.includes('1.') && prompt.includes('2.') },
      { name: 'Contains chain name (solana)', test: prompt.includes('solana') },
      { name: 'Contains pairs count', test: prompt.includes(`${pairs.length} tokens`) },
      { name: 'Contains price information', test: prompt.includes('Price: $') },
      { name: 'Contains 5-minute volume data', test: prompt.includes('5-minute Volume:') },
      { name: 'Contains liquidity data', test: prompt.includes('Liquidity:') },
      { name: 'Contains price change percentage', test: prompt.includes('5-minute Change:') && prompt.includes('%') },
      { name: 'Contains transaction data', test: prompt.includes('Transactions:') && prompt.includes('buys') && prompt.includes('sells') },
      { name: 'Contains market cap', test: prompt.includes('Market Cap:') },
      { name: 'Contains FDV', test: prompt.includes('FDV:') },
      { name: 'Contains chain ID', test: prompt.includes('Chain:') },
      { name: 'Contains DEX info', test: prompt.includes('DEX:') },
      { name: 'Contains pair age', test: prompt.includes('Pair Age:') },
      { name: 'Contains labels field', test: prompt.includes('Labels:') },
      { name: 'Contains trend comparison', test: prompt.includes('Trend Comparison:') },
      { name: 'Contains multi-timeframe analysis', test: prompt.includes('Multi-Timeframe Analysis:') },
      { name: 'Contains trend strength', test: prompt.includes('Trend Strength:') },
      { name: 'Contains momentum pattern', test: prompt.includes('Momentum:') },
      { name: 'Contains volatility pattern', test: prompt.includes('Volatility:') },
      { name: 'Contains buy pressure', test: prompt.includes('Buy Pressure:') },
      { name: 'Contains analytical framework', test: prompt.includes('ANALYTICAL FRAMEWORK') },
      { name: 'Contains JSON format instruction', test: prompt.includes('Format your response as JSON') },
      { name: 'Contains topPick field', test: prompt.includes('"topPick"') },
      { name: 'Contains pairs array field', test: prompt.includes('"pairs"') },
      { name: 'Contains runnerUps field', test: prompt.includes('"runnerUps"') },
      { name: 'Contains marketPulse field', test: prompt.includes('"marketPulse"') },
      { name: 'Contains language instruction (EN)', test: prompt.includes('IMPORTANT: Respond in English') },
      { name: 'Does NOT contain Japanese instruction', test: !prompt.includes('日本語') },
    ];

    let passedChecks = 0;
    checks.forEach(check => {
      const status = check.test ? '✓' : '❌';
      console.log(`${status} ${check.name}`);
      if (check.test) passedChecks++;
    });

    console.log('\n--- Data Quality Checks ---');
    const dataChecks = [
      {
        name: 'All pairs have base/quote tokens',
        test: pairs.every(p => p.baseToken && p.quoteToken)
      },
      {
        name: 'All pairs have price data',
        test: pairs.every(p => p.priceUsd)
      },
      {
        name: 'At least 50% have volume data',
        test: pairs.filter(p => p.volume?.m5).length >= pairs.length / 2
      },
      {
        name: 'At least 50% have liquidity data',
        test: pairs.filter(p => p.liquidity?.usd).length >= pairs.length / 2
      },
      {
        name: 'At least 50% have transaction data',
        test: pairs.filter(p => p.txns?.m5).length >= pairs.length / 2
      },
      {
        name: 'At least 30% have multi-timeframe data',
        test: pairs.filter(p => p.priceChange?.h1 && p.priceChange?.h6).length >= pairs.length * 0.3
      },
    ];

    dataChecks.forEach(check => {
      const status = check.test ? '✓' : '⚠️';
      console.log(`${status} ${check.name}`);
      if (check.test) passedChecks++;
    });

    console.log('\n--- Sample: Prompt Header (first 800 chars) ---');
    console.log(prompt.substring(0, 800));
    console.log('...\n');

    console.log('--- Sample: First Pair Data ---');
    const pairDataMatch = prompt.match(/1\. ([\s\S]*?)(?=\n\n2\.|$)/);
    if (pairDataMatch) {
      console.log(pairDataMatch[0]);
      console.log('...\n');
    }

    console.log('--- Sample: Analytical Framework Section ---');
    const frameworkMatch = prompt.match(/\*\*ANALYTICAL FRAMEWORK:\*\*([\s\S]{0,600})/);
    if (frameworkMatch) {
      console.log(frameworkMatch[0]);
      console.log('...\n');
    }

    console.log('--- Sample: JSON Format Section ---');
    const jsonMatch = prompt.match(/Format your response as JSON:([\s\S]{0,500})/);
    if (jsonMatch) {
      console.log(jsonMatch[0]);
      console.log('...\n');
    }

    console.log('=== Test Complete ===');
    const totalChecks = checks.length + dataChecks.length;
    console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed`);
    console.log(`📈 Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%\n`);

    if (passedChecks === totalChecks) {
      console.log('✅ All checks passed! Prompt generation is working correctly.');
    } else if (passedChecks >= totalChecks * 0.9) {
      console.log('✅ Prompt generation is mostly correct. Minor issues detected.');
    } else if (passedChecks >= totalChecks * 0.7) {
      console.log('⚠️  Prompt generation has some issues. Please review.');
    } else {
      console.log('❌ Prompt generation has significant issues. Please debug.');
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('\nError details:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

function formatAge(timestamp: number): string {
  const ageMs = Date.now() - timestamp;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageMinutes < 60) return `${ageMinutes} minutes`;
  if (ageHours < 24) return `${ageHours} hours`;
  return `${ageDays} days`;
}

// Run the test
testPromptGeneration().then(() => {
  console.log('\n✓ Test script completed');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Test script failed:', err);
  process.exit(1);
});
