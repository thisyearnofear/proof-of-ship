# Proof of Ship — Setup Guide

Get started with the platform in minutes.

## Quick Start

1. **Visit** [proofofship.com](https://proofofship.com)
2. **Connect** your wallet (MetaMask, Phantom, or Solflare)
3. **Explore** projects on the **Explore** page
4. **Back** projects on the **Back** page

## Setting Up Your Payment Wallet

To use AI agents (Scout, Underwriter, Verifier), you need a payment wallet with USDC on Arc.

### Option 1: Demo Mode (Recommended for Testing)

Demo mode is free and lets you test the full AI agent flow without real payments.

1. Go to **Back → Economy** tab
2. Click **"Use Demo Mode"**
3. That's it — you can now run AI agents for free

### Option 2: Live USDC Wallet

For real nanopayments:

1. **Get USDC** on Arc testnet:
   - Visit the [Arc Faucet](https://www.circle.com/en/USDC)
   - Or ask in the Proof of Ship Discord

2. **Set up your wallet** on **Back → Economy**:
   - Connect your wallet
   - Click **"Set Up Payment"**
   - Follow the prompts to deposit USDC

3. **Verify** your balance is showing

## Using AI Agents

### Scout Agent (0.01 USDC)

Finds the best projects across all ecosystems.

1. Go to **Back → Economy**
2. Click **Run Scout**
3. Review the top projects and scores

### Underwriter Agent (0.05 USDC)

Analyzes a specific project in depth.

1. Go to **Back → Discover**
2. Find a project you like
3. Click **Analyze** → **Run Underwriter**
4. Review the health score and breakdown

### Verifier Agent (0.01 USDC)

Checks code quality and security.

1. Open any project detail page
2. Click **Verify** in the AI Agents section
3. Review the verification report

## Understanding Results

Each agent returns:

- **status**: `ok`, `fallback`, or `error`
- **resultSource**: Where the result came from:
  - `live_ai` — real AI analysis
  - `cached` — previous result (faster)
  - `demo` — demo mode (free)
  - `rule_based` — scoring algorithm
- **nextAction**: Suggested next step
- **agentInfo**: Payment details and tx hash

## Troubleshooting

### "Payment Required" Error

- Switch to **demo mode** for free testing
- Or **deposit USDC** in your payment wallet

### "Project Not Found"

- The project may have been removed
- Try searching on the **Explore** page

### Wallet Connection Issues

- Clear browser cache
- Try a different wallet extension
- Make sure you're on the right network (Arc for mainnet)

## Need Help?

- Join our [Discord](https://discord.gg/proofofship)
- Ask in the #support channel
- Or use the in-app chat assistant (free guide mode)