# Builder Credit × Arc: Agentic Economy Implementation

## Hackathon: Agentic Economy on Arc (lablab.ai, Apr 20–26 2026)
## Track: Per-API Monetization & Agent-to-Agent Payment Loops

### What We Are Building
We are evolving `proof-of-ship` into a fully Agentic Economy by introducing AI Agents that act as sovereign economic actors. These agents provide critical underwriting and verification services for the builder ecosystem and charge micro-fees via Circle Nanopayments on Arc.

### Core Features

#### 1. The AI Underwriter API (Per-Request Nanopayments)
- **Concept:** An AI agent that evaluates a builder's GitHub activity, PR quality, and issue resolution rate to generate a real-time objective "Health Score" for backers.
- **The Monetization:** This API requires a high-frequency nanopayment of `0.05 USDC` per evaluation.
- **Why it wins:** Perfectly demonstrates the "Per-API Monetization Engine" track, turning AI analysis into a usage-based micro-service.

#### 2. AI Scout (Portfolio Recommendations)
- **Concept:** An AI agent that scans the ecosystem for undervalued projects and recommends micro-backings.
- **The Monetization:** Each scout run costs `0.01 USDC`.
- **Why it wins:** Enables pay-per-use portfolio analysis without subscription fees.

#### 3. Verifier Agent (Code Verification)
- **Concept:** An AI agent that verifies code submitted as milestone evidence.
- **The Monetization:** `0.001 USDC` per 10 lines of code verified.
- **Why it wins:** Leverages machine-to-machine (M2M) micro-transactions that would be impossible on traditional L1s due to gas overhead.

#### 4. AI Portfolio Manager (Auto-Rebalancing)
- **Concept:** An AI agent that automatically rebalances user portfolios to promising projects.
- **The Monetization:** `0.01 USDC` per rebalancing action.
- **Why it wins:** Creates literal "Agentic Economy" where AI agents earn capital for smart investment decisions.

### Technical Architecture & Workflow

```
User/Backer → Requests Agent Service
    ↓
Frontend creates Circle Nanopayment Auth (EIP-3009 off-chain)
    ↓
API Endpoint (/api/agent/underwrite, /api/agent/scout, etc.)
    ↓
Middleware validates Nanopayment (settles on Arc via Circle Gateway)
    ↓
AI Agent computes result
    ↓
API returns result + agentInfo (feePaid, txHash, network: "arc")
```

### Agent Pricing Summary

| Agent | Price | Endpoint | Purpose |
|------|-------|---------|---------|
| AI Underwriter | 0.05 USDC | `/api/agent/underwrite` | Project health scoring |
| AI Scout | 0.01 USDC | `/api/agent/scout` | Portfolio recommendations |
| Verifier Agent | 0.01 USDC | `/api/agent/verify` | Code verification |
| AI Chat Assistant | 0.005 USDC | `/api/agent/chat` | Platform help & guidance |

### Why Arc & Circle Nanopayments?
Traditional verification/underwriting platforms rely on high monthly subscriptions because processing credit card micro-transactions ($0.05) is economically unviable due to flat payment processing fees.
Similarly, traditional blockchains (Ethereum/Polygon) have gas fees that far exceed $0.05.

**Arc solves this:**
- Zero gas fees for the nanopayment transactions (using USDC natively).
- Sub-second settlement allows APIs to execute instantly without blocking the UI.
- Enables true machine-to-machine usage-based billing at high frequency.

### Implementation Status
- [x] **Core Principles Check:** Aligned with ENHANCEMENT FIRST and PREVENT BLOAT
- [x] Circle Nanopayment middleware (`src/lib/nanopayment.js`) with IP-based rate limiting
- [x] AIsa x402 paying fetch client (`src/lib/aisaClient.js`)
- [x] AI Underwriter endpoint (`/api/agent/underwrite` - 0.05 USDC + AI enrichment)
- [x] AI Scout endpoint (`/api/agent/scout` - 0.01 USDC + AI ecosystem analysis)
- [x] AI Verifier endpoint (`/api/agent/verify` - 0.01 USDC + AI code analysis)
- [x] AI Chat Assistant (`/api/agent/chat` - 0.005 USDC, Featherless → AIsa → contextual fallback)
- [x] Agent-to-agent x402 payment loops (our agents → AIsa Perplexity Sonar)
- [x] Dual AI provider chain: Featherless AI (DeepSeek-V3) primary, AIsa x402 fallback
- [x] SNS Identity integration — builders and agents display .sol domain names (pos-scout.sol, etc.)
- [x] Frontend NanopaymentContext (`src/contexts/NanopaymentContext.tsx`)
- [x] NanopaymentService (`src/services/nanopaymentService.ts`)
- [x] NanopaymentWidget (`src/components/common/NanopaymentWidget.js`)
- [x] NanopaymentLedger (`src/components/common/NanopaymentLedger.js`)
- [x] Floating AI Chat Widget — collapsible, dismissable, minimizable
- [x] ProjectCard integration (Analyze button for projects without health scores)
- [x] Demo mode support (NEXT_PUBLIC_DEMO_MODE=true)
- [x] Margin analysis documentation
- [x] 7 ecosystems on explore page with search & filtering
- [x] Onboarding banner, SEO meta tags, share buttons
- [x] Project add/edit/delete flow with GitHub auto-populate
- [x] Transaction activity feed and navbar balance indicator
- [x] Buyer + AIsa wallets funded on Arc Testnet (20 / 10 USDC)
- [x] Featherless AI primary chat provider wired
- [x] AIsa x402 agent-to-agent loop wired (OWS_MNEMONIC configured)
- [x] Anchor program deployed to Solana devnet (`14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K`)
- [x] 7 confirmed on-chain transactions (Treasury, Projects, Backings, Milestone, Repay)
- [x] Cloak private (shielded) USDC transfers for backer staking via CloakPaymentService
- [x] QVAC local-first AI inference option in chat widget (Tether SDK, graceful fallback)
- [x] SNS Identity integration — builders and agents display .sol domain names (pos-scout.sol, etc.)
- [x] Agent identities wired into all API responses + 6 UI components
- [ ] 50+ real on-chain transactions on Arc testnet
- [ ] Transaction flow demo video

### Funded Wallets (Arc Testnet)

| Role | Address | Purpose |
|------|---------|---------|
| Agent / Buyer | `0x3De205B21e9d313332BB167Ebc1590A37BF96dF9` | Signs nanopayments + on-chain backings (`AGENT_PRIVATE_KEY` / `PRIVATE_KEY`) |
| AIsa Buyer | `0x46Dd93AB40a62C03Ff1f8bFA9C013F2251E4EC07` | Pays Perplexity Sonar in agent-to-agent x402 loop (`OWS_MNEMONIC`) |
| Gateway Recipient | `0x75d928668e7268241f194f441C23B5cE31936F67` | Collects USDC from nanopayments (`CIRCLE_GATEWAY_WALLET_ADDRESS`) |

Funding tx (Agent → AIsa, 10 USDC): [`0x8881ebc18d6963a93bba010fd64b4908bdaa7c63c78bb6173b0a595ee2014d44`](https://explorer.testnet.arc.network/tx/0x8881ebc18d6963a93bba010fd64b4908bdaa7c63c78bb6173b0a595ee2014d44)

### Files Changed

**Backend (API Routes & Lib)**
- `src/lib/nanopayment.js` - Circle x402 middleware with demo fallback + IP rate limiting
- `src/lib/aisaClient.js` - AIsa x402 paying fetch client (GatewayEvmScheme, singleton)
- `src/pages/api/agent/underwrite.js` - AI Underwriter with nanopayment + AI enrichment
- `src/pages/api/agent/scout.js` - AI Scout with nanopayment + AI ecosystem analysis
- `src/pages/api/agent/verify.js` - AI Verifier with nanopayment + AI code analysis
- `src/pages/api/agent/chat.js` - AI Chat Assistant (Featherless → AIsa → contextual fallback)

**Frontend (Context & Service)**
- `src/contexts/NanopaymentContext.tsx` - All agent payment methods
- `src/services/nanopaymentService.ts` - Circle Gateway client

**Frontend (Components)**
- `src/components/common/NanopaymentWidget.js` - Mobile-responsive widget
- `src/components/common/NanopaymentLedger.js` - Transaction history
- `src/components/common/AIChatWidget.js` - Floating chat (collapsible/dismissable/minimizable)
- `src/components/common/TransactionFeed.js` - Live transaction activity feed
- `src/components/common/OnboardingBanner.js` - First-time visitor walkthrough
- `src/components/common/ShareButtons.js` - X/Farcaster share buttons
- `src/components/projects/ProjectCard.js` - Analyze button integration
- `src/components/dashboard/EcosystemSection.js` - Improved empty states

**Frontend (Pages)**
- `src/pages/index.js` - Arc hero section, x402 flow diagram, all 7 ecosystems
- `src/pages/explore.js` - Search/filtering, 7 ecosystems, hackathon tab
- `src/pages/back.js` - Redesigned Economy tab with agent explainers
- `src/pages/profile.js` - My Projects, nanopayment stats, transaction feed
- `src/pages/_document.js` - SEO meta tags

**Frontend (Providers)**
- `src/providers/AppProviders.js` - NanopaymentProvider + UserBehaviorProvider added
- `src/components/common/index.js` - Exports added

### Demo Mode

To test without real Circle API keys:

```bash
# In .env.local
NEXT_PUBLIC_DEMO_MODE=true
```

The app will work with mock nanopayments, showing the full UX flow.

### Environment Variables

```env
# AI Providers (cascading: Featherless → AIsa → contextual fallback)
FEATHERLESS_API_KEY=your_featherless_key    # Primary: DeepSeek-V3-0324
OWS_MNEMONIC=your_mnemonic                  # Fallback: AIsa x402 Perplexity Sonar

# Circle x402 Nanopayments
CIRCLE_GATEWAY_WALLET_ADDRESS=0x...
PRIVATE_KEY=0x...  # Buyer's wallet private key
NEXT_PUBLIC_DEMO_MODE=true  # For testing without keys

# Arc Network
NEXT_PUBLIC_ARC_CHAIN_ID=1993
```

### Margin Analysis: Why This Only Works on Arc

Per-action pricing ≤$0.01 is economically impossible on any chain with non-zero gas. The numbers:

| Metric | Ethereum L1 | Polygon PoS | Arc + Nanopayments |
|--------|------------|-------------|-------------------|
| Cost per transaction | $0.50–$5.00 | $0.01–$0.03 | $0.00 (gasless EIP-3009) |
| Settlement overhead | Gas per tx | Gas per tx | Batched by Gateway |
| Min viable price | >$5.00 | >$0.03 | $0.001 |
| Verifier (0.001 USDC/10 LOC) | ❌ -$4.999 loss | ❌ -$0.029 loss | ✅ $0.001 profit |
| Scout (0.01 USDC/run) | ❌ -$4.99 loss | ❌ -$0.02 loss | ✅ $0.01 profit |
| Underwriter (0.05 USDC) | ❌ -$4.95 loss | ⚠️ ~breakeven | ✅ $0.05 profit |

**Scale Economics:**
- At 1,000 verifications/day: Ethereum cost = $500–$5,000 in gas, revenue = $1. Arc cost = $0, revenue = $1.
- At 10,000 scout runs/month: Ethereum cost = $5,000–$50,000, revenue = $100. Arc cost = $0, revenue = $100.
- The AIsa agent-to-agent loop (our Underwriter paying $0.012 to Perplexity) earns $0.038 margin per call — only viable because neither hop incurs gas.

### Transaction Flow Demonstration Guide

Step-by-step guide for recording the required demo video:

1. **Setup**: Fund your OWS wallet with testnet USDC from https://faucet.circle.com (select Arc Testnet).
2. **Circle Developer Console**: Show wallet balance in Circle Console at console.circle.com to confirm funds.
3. **Trigger Agent Transactions**:
   - Call `/api/agent/scout` (0.01 USDC) — show ecosystem analysis result.
   - Call `/api/agent/underwrite?projectId=X` (0.05 USDC) — show AI health score with Perplexity enrichment.
   - Call `/api/agent/verify?prId=1&lines=100` (0.01 USDC) — show code verification output.
   - Repeat to generate 50+ transactions to demonstrate high-frequency viability.
4. **Arc Block Explorer**: Verify transactions at the Arc testnet explorer, showing USDC settlement on-chain.
5. **Agent-to-Agent Loop**: Show that the Underwriter's call to AIsa Perplexity is itself an x402 nanopayment — the `aisaPayment` field in the response proves the secondary settlement.