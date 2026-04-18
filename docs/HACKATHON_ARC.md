# Builder Credit × Arc: AI Scout Agent

## Hackathon: Agentic Economy on Arc (lablab.ai, Apr 20–26 2026)
## Track: Agent-to-Agent Payment Loop

### What We Built

An autonomous AI agent that scouts hackathon projects, evaluates builder credibility, and micro-stakes USDC on promising builders via Circle Nanopayments on Arc.

### Why This Matters

Builder Credit has a cold start problem: who backs builders first? The AI Scout Agent solves this by autonomously evaluating projects and placing micro-stakes, creating trust signals that attract human backers.

### How It Works

1. Agent fetches projects from Firestore (GitHub velocity, commit frequency, contributor count)
2. Scores each project 0–100 using a predictive model for milestone completion probability
3. For projects scoring >60, signs EIP-3009 nanopayment authorizations (offchain, gas-free)
4. Gateway batches authorizations and settles on Arc
5. Agent calls `backProject()` on BuilderCreditCore deployed on Arc Testnet
6. Frontend shows "🤖 AI-Backed" badge on scouted projects

### Why Nanopayments + Arc

The agent makes 50–100 micro-stakes per run ($0.50–$5.00 each). On Ethereum, gas alone would cost more than the stakes. On Arc:
- USDC is the native gas token — no ETH needed
- Nanopayments batch settlements — zero per-transaction gas for the agent
- Sub-second deterministic finality — agent gets instant confirmation
- Total cost for 100 micro-stakes: ~$0.01 vs ~$50+ on Ethereum L1

### Circle Products Used

- **Arc** — Settlement layer (chain ID 5042002)
- **USDC** — Native gas token + staking currency
- **Circle Nanopayments** — Gas-free batched micro-stakes via x402
- **Circle Gateway** — Unified USDC balance for agent treasury
- **Circle Wallets** — Agent wallet infrastructure

### Contract Addresses (Arc Testnet)

- BuilderCreditCore: `TBD after deployment`
- HackathonRegistry: `TBD after deployment`
- USDC (ERC-20 interface): `0x3600000000000000000000000000000000000000`

### Architecture

```
Firestore (projects) → Scout Agent → Score (AI) → Nanopayment Auth (offchain)
                                                          ↓
                                              Circle Gateway (batch)
                                                          ↓
                                              Arc Testnet (settle)
                                                          ↓
                                         BuilderCreditCore.backProject()
                                                          ↓
                                         Frontend: "🤖 AI-Backed" badge
```

### Demo

- Video: TBD
- Live: [proofofship.web.app](https://proofofship.web.app)
- GitHub: [github.com/thisyearnofear/proof-of-ship](https://github.com/thisyearnofear/proof-of-ship)
- Explorer: [testnet.arcscan.app](https://testnet.arcscan.app)

### Deployment

```bash
# Deploy to Arc Testnet
cd blockchain
npx hardhat run scripts/deploy-contracts.js --network arcTestnet
```
