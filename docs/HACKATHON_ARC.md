# Builder Credit × Arc: Agentic Economy Implementation

## Hackathon: Agentic Economy on Arc (lablab.ai, Apr 20–26 2026)
## Track: Per-API Monetization & Agent-to-Agent Payment Loops

### What We Are Building
We are evolving `proof-of-ship` into a practical agentic workflow on Arc: users choose a project, run an agent, review a structured result, and then decide whether to back or verify. Arc is used for fast USDC settlement and deterministic completion states; the UI now emphasizes a single happy path instead of multiple fragmented agent surfaces.

### Core Flow
1. **Pick a project** in Discover.
2. **Run Scout / Underwriter / Verifier** from the analysis workspace.
3. **Review the result source** (`live_ai`, `cached`, `demo`, `fallback`, or `rule_based`).
4. **Take the next action** (back, retry, or adjust payment setup).

### Core Features

#### 1. The AI Underwriter API (Per-Request Nanopayments)
- **Concept:** Evaluates a builder's project and returns a health score plus next-action guidance.
- **The Monetization:** `0.05 USDC` per evaluation.
- **Why it wins:** Directly maps to a useful user decision and now returns explicit status/result metadata.

#### 2. AI Scout (Portfolio Recommendations)
- **Concept:** Scans the ecosystem for interesting projects and recommends where to look first.
- **The Monetization:** `0.01 USDC` per scan.
- **Why it wins:** Short, actionable output with clearer completion states.

#### 3. Verifier Agent (Code Verification)
- **Concept:** Reviews PRs and reports whether automated verification is available.
- **The Monetization:** `0.001 USDC` per 10 LOC.
- **Why it wins:** No more fabricated approval; if the agent can't verify, it says so explicitly.

#### 4. AI Chat Assistant (Guidance Only)
- **Concept:** A lightweight helper that routes users into the real project-analysis flow.
- **The Monetization:** `0.005 USDC` premium guidance.
- **Why it wins:** Chat now behaves like a launcher for useful tasks, not a dead-end bot.

### Why Arc & Circle Nanopayments?
- USDC-native settlement.
- Fast confirmation for small-value API calls.
- Clear separation between demo and live flows.

### Reliability Improvements
- Removed random verifier success.
- Standardized API response metadata (`status`, `resultSource`, `nextAction`).
- Demo and live payment behavior are now explicit.
- UI surfaces now show clear completion and fallback states.

### Files Changed

**Backend (API Routes & Lib)**
- `src/lib/nanopayment.js`
- `src/server/aisaClient.js`
- `src/pages/api/agent/underwrite.js`
- `src/pages/api/agent/scout.js`
- `src/pages/api/agent/verify.js`
- `src/pages/api/agent/chat.js`

**Frontend (Context & Service)**
- `src/contexts/WalletContext.tsx`
- `src/contexts/wallet/types.ts`
- `src/services/nanopaymentService.ts`

**Frontend (Components)**
- `src/components/common/NanopaymentWidget.js`
- `src/components/common/AIChatWidget.js`
- `src/components/back/EconomyTab.js`
- `src/components/back/DiscoverTab.js`

### Verification
- Unit test the payment and result-state behavior.
- Run the frontend test suite.
- Manually confirm:
  - demo mode completes cleanly,
  - live mode shows payment-required states clearly,
  - scout/underwrite/verify return explicit completion metadata.

### Notes
This implementation is intentionally less protocol-heavy in the UI and more outcome-focused for users.
