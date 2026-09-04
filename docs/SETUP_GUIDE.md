# PledgeBond — Setup Guide

Get started with the platform in minutes.

## Quick Start

1. **Visit** [pledgebond.com](https://pledgebond.com)
2. **Connect** your wallet (MetaMask, Phantom, or Solflare)
3. **Explore** projects on the **Explore** page
4. **Back** projects on the **Back** page

## Setting Up Your Payment Wallet

To use AI agents (Scout, Underwriter, Verifier), you need a payment wallet with USDC on Arc.

### Get USDC on Arc Testnet

1. Visit the [Arc Faucet](https://www.circle.com/en/USDC)
2. Or ask in the PledgeBond Discord

### Set Up Your Wallet

1. Go to **Back → Economy**
2. Click **"Set up payment wallet"**
3. Follow the prompts to deposit USDC
4. Verify your balance is showing

### Test Mode (Optional)

For testing without real payments, enable test mode in the Economy tab toggle.
Test mode skips payment verification and marks responses as `test_mode`.
Requires `ALLOW_DEMO_PAYMENTS=true` on the server (never enabled in production).

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
  - `rule_based` — scoring algorithm
  - `fallback` — degraded output
- **nextAction**: Suggested next step
- **agentInfo**: Payment details and tx hash
- **agentInfo.paymentStatus**: `verified`, `test_mode`, `degraded`, or `unverified`

## Troubleshooting

### "Payment Required" Error

- **Deposit USDC** in your payment wallet on the Economy tab
- Or enable **test mode** in the Economy tab toggle (requires server-side `ALLOW_DEMO_PAYMENTS=true`)

### "Project Not Found"

- The project may have been removed
- Try searching on the **Explore** page

### Wallet Connection Issues

- Clear browser cache
- Try a different wallet extension
- Make sure you're on the right network (Arc for mainnet)

## Need Help?

- Use the in-app chat assistant (free guide mode)
- Open an issue on GitHub