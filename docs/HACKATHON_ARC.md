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
| Verifier Agent | 0.001 USDC/10 LOC | `/api/agent/verify` | Code verification |
| AI Portfolio Manager | 0.01 USDC | `/api/agent/rebalance` | Auto-rebalancing |

### Why Arc & Circle Nanopayments?
Traditional verification/underwriting platforms rely on high monthly subscriptions because processing credit card micro-transactions ($0.05) is economically unviable due to flat payment processing fees.
Similarly, traditional blockchains (Ethereum/Polygon) have gas fees that far exceed $0.05.

**Arc solves this:**
- Zero gas fees for the nanopayment transactions (using USDC natively).
- Sub-second settlement allows APIs to execute instantly without blocking the UI.
- Enables true machine-to-machine usage-based billing at high frequency.

### Implementation Status
- [x] **Core Principles Check:** Aligned with ENHANCEMENT FIRST and PREVENT BLOAT
- [x] Circle Nanopayment middleware (`src/lib/nanopayment.js`)
- [x] AI Underwriter endpoint (`/api/agent/underwrite` - 0.05 USDC)
- [x] AI Scout endpoint (`/api/agent/scout` - 0.01 USDC)
- [x] Frontend NanopaymentContext (`src/contexts/NanopaymentContext.tsx`)
- [x] NanopaymentService (`src/services/nanopaymentService.ts`)
- [x] NanopaymentWidget (`src/components/common/NanopaymentWidget.js`)
- [x] NanopaymentLedger (`src/components/common/NanopaymentLedger.js`)
- [x] ProjectCard integration (Analyze button for projects without health scores)
- [x] Demo mode support (NEXT_PUBLIC_DEMO_MODE=true)

### Files Changed

**Backend (API Routes)**
- `src/lib/nanopayment.js` - Real Circle x402 middleware with demo fallback
- `src/pages/api/agent/underwrite.js` - AI Underwriter with nanopayment
- `src/pages/api/agent/scout.js` - AI Scout with nanopayment

**Frontend (Context & Service)**
- `src/contexts/NanopaymentContext.tsx` - All agent payment methods
- `src/services/nanopaymentService.ts` - GatewayClient wrapper
- `src/services/nanopaymentService.ts` - Circle Gateway client

**Frontend (Components)**
- `src/components/common/NanopaymentWidget.js` - Mobile-responsive widget
- `src/components/common/NanopaymentLedger.js` - Transaction history
- `src/components/projects/ProjectCard.js` - Analyze button integration

**Frontend (Providers)**
- `src/providers/AppProviders.js` - NanopaymentProvider added
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
# Circle x402 Nanopayments
CIRCLE_GATEWAY_WALLET_ADDRESS=0x...
PRIVATE_KEY=0x...  # Buyer's wallet private key
NEXT_PUBLIC_DEMO_MODE=true  # For testing without keys

# Arc Network
NEXT_PUBLIC_ARC_CHAIN_ID=1993
```