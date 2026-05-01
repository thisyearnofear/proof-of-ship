# Proof of Ship — Colosseum Frontier Hackathon Submission

> **Public Goods track** — Capital infrastructure for builders, powered by on-chain credit, AI agents, and community staking.

---

## One-liner

Proof of Ship is the capital stack for software builders: on-chain credit collateralized by hackathon prizes, community-backed staking with privacy, and AI agents that price, scout, and verify work — all as an open, composable public good.

---

## Why This Is a Public Good

Every component of Proof of Ship benefits the Solana ecosystem beyond any single user:

1. **On-chain reputation is infrastructure.** Builder credit scores, backer track records, and project verification signals are anchored on-chain and composable by anyone. No API key, no walled garden.

2. **AI agents are ecosystem services.** The Scout, Underwriter, and Verifier agents evaluate projects transparently. Their scoring models, pricing, and outputs are open — any protocol can integrate them.

3. **Staking is permissionless.** Any wallet can back any builder. There's no gatekeeper, no whitelist, no minimum. Cloak integration means even the amounts are optional to reveal.

4. **The reputation compounds externally.** A builder's Proof of Ship credit score is a portable signal for any Solana protocol — grants programs, hackathon organizers, DAOs, other DeFi protocols.

---

## What We Built

### The Capital Stack

| Rail | Instrument | Chain | Purpose |
|------|-----------|-------|---------|
| **Rail 1** | Bags Token | Solana | Pre-prize community capital via project tokens |
| **Rail 2** | x402 Credit Line | Arc / Solana | USDC credit collateralized by hackathon prizes |
| **Rail 3** | Prize Routing | Any | Auto-repayment from hackathon prize wins |

### AI Agent Layer (cross-rail)

| Agent | Price | Capability |
|-------|-------|-----------|
| **Scout** (`pos-scout.sol`) | $0.01 | Ecosystem scanning, project discovery, portfolio recommendations |
| **Underwriter** (`pos-underwriter.sol`) | $0.05 | Project health scoring, credit line sizing, risk analysis |
| **Verifier** (`pos-verifier.sol`) | $0.001/10 LOC | PR code review, milestone verification, on-chain confirmation |
| **Rebalance** (`pos-rebalance.sol`) | $0.01 | Portfolio optimization across expeditions |

Each agent earns per-call via x402 nanopayments on Arc — zero gas, sub-second settlement.

### Identity Layer

- **SNS (.sol domains)** — Builders and agents display human-readable on-chain identities via Solana Name Service integration. A builder named `alice.sol` is more legible than `7xKX...4pQr`.
- **Agent identities** — Each AI agent has a registered .sol domain (`pos-scout.sol`, etc.) providing on-chain identity for machine-to-machine transactions.

### Privacy Layer

- **Cloak shielded transfers** — Backers can stake without revealing positions (preventing copy-staking). Builders can receive payouts without earnings being public. Uses Cloak's UTXO shielded pool on Solana with Groth16 proofs generated client-side.

### Local-First AI

- **QVAC by Tether** — AI analysis runs locally on the user's device when possible, keeping project data private. Score analysis, project health checks, and GitHub data processing don't require routing through cloud APIs.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Proof of Ship                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Frontend  │  │  Agent   │  │  Snap    │              │
│  │ (Next.js) │  │ API Layer│  │  Server  │              │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘              │
│        │            │              │                     │
│  ┌─────┴────────────┴──────────────┴─────┐              │
│  │         Service Layer                  │              │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐│              │
│  │  │ Solana   │ │ Cloak    │ │ QVAC   ││              │
│  │  │ Credit   │ │ Private  │ │ Local  ││              │
│  │  │ Service  │ │ Payments │ │ AI     ││              │
│  │  └──────────┘ └──────────┘ └────────┘│              │
│  └───────────────────────────────────────┘              │
│        │            │              │                     │
│  ┌─────┴────────────┴──────────────┴─────┐              │
│  │         On-Chain Layer                 │              │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐│              │
│  │  │ Anchor   │ │ SNS      │ │ Cloak  ││              │
│  │  │ Program  │ │ Identity │ │ Shield ││              │
│  │  └──────────┘ └──────────┘ └────────┘│              │
│  └───────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## Judge Alignment

### Lily Liu (Solana Foundation President)
Proof of Ship is ecosystem infrastructure. The on-chain credit scores and reputation data are open, composable, and benefit every Solana protocol. This is what Solana needs more of — infrastructure that makes builders legible without gatekeepers.

### Anatoly Yakovenko (Solana Cofounder)
Zero-gas nanopayments for AI agents. x402 on Arc enables per-call pricing at $0.001 — impossible on any chain with non-zero gas. The agent layer is the kind of high-frequency, low-value transaction pattern that only Solana's throughput can support at scale.

---

## Files & Links

- **Live:** [proofofship.web.app](https://proofofship.web.app)
- **Mirror:** [proof-of-ship.vercel.app](https://proof-of-ship.vercel.app)
- **GitHub:** [github.com/thisyearnofear/proof-of-ship](https://github.com/thisyearnofear/proof-of-ship)
- **Docs:** [docs/](./README.md)

---

## Side Track Eligibility

This submission is simultaneously eligible for:

1. **Colosseum Public Goods Award** ($10K) — this submission
2. **SNS Identity Track** ($5K) — .sol domain integration for builders and agents
3. **Cloak Track** ($5K) — shielded USDC transfers for private staking
4. **Tether Frontier Track** ($10K) — QVAC local-first AI integration
