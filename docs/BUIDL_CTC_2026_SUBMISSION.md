# PledgeBond — BUIDL CTC 2026 Fall Submission

> Creditcoin × Credit Labs — capital infrastructure for builders, powered by on-chain credit, AI agents, and Attestcoin-verified cross-chain data.

---

## Hackathon

- **Name:** BUIDL CTC 2026 Fall
- **Sponsors:** Creditcoin & Credit Labs
- **Submission deadline:** September 13, 2026 (extended)
- **URL:** https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail
- **Tracks:** DeFi, RWA, DePIN, Gaming, AI

## Prize Pool

- **Grand Prize:** $10,000
- **2nd Place:** $3,000
- **3rd Place:** $2,000
- **Top 3 fast-track into the Creditcoin Ecosystem Investment Program**
- **All winners receive CertiK audit credits**

Total pool: $15,000

---

## 30-Second Pitch

PledgeBond on Creditcoin — an AI credit underwriter that reads Attestcoin, no centralized oracles.

A builder submits a milestone. The Verifier agent writes an Attestcoin attestation. The Underwriter reads that attestation and prices a cross-chain credit line. Backers fund the line, trustlessly.

The value is not the agent — it is the trustless credit decision.

---

## Why PledgeBond Is the Best Fit

PledgeBond is the only project in the catalog that is genuinely a credit platform — and BUIDL CTC is built on Creditcoin, a credit/microfinance blockchain.

### Credit-first design

- Backers fund builders with USDC on-chain.
- Hackathon prizes collateralize credit lines.
- **Verifier** writes Attestcoin attestations for milestones and backer commitments.
- **Underwriter** consumes those attestations to price credit.
- Core thesis: "Capital infrastructure for builders, powered by on-chain credit, Attestcoin verification, and AI underwriting."

### Cross-chain by default

- 7 ecosystems supported: Solana, Arc, Celo, Base, Linea, Arbitrum, Ethereum, Optimism.
- Bridging currently via LI.FI.
- Moving to Creditcoin + Attestcoin lets us replace bridge-dependent verification with trustless, cross-chain credit and milestone attestation.

### Attestcoin integration point

Attestcoin provides verified cross-chain data and messaging without centralized oracle operators — exactly what PledgeBond needs to verify:

- Cross-chain milestone completion
- Backer commitments and staking
- Builder creditworthiness

Instead of relying on LI.FI bridge receipts plus centralized verification, PledgeBond can consume Attestcoin attestations as the single source of truth for credit events across all supported chains.

### Track alignment

- **DeFi** — credit / lending / staking is the primary mechanism.
- **AI** — Verifier and Underwriter agents consume Attestcoin-verified data; x402 nanopayments are the execution rail.

---

## What We Already Built

PledgeBond is submission-ready without a ground-up rebuild:

| Layer | Status |
|---|---|
| Cross-chain credit rails | Live — 7 chains, LI.FI bridging, USDC backing flows |
| Milestone verification | Smart-contract + admin verification, on-chain self-verification guard |
| AI agents | Scout, Underwriter, Verifier, Rebalance — priced and executed via x402/Circle nanopayments |
| Real-time winner moments | Verification, backing received, payout verified, rank change notifications |
| Public reputation | Verified winner badges, leaderboards, portfolio pages |
| Docs | HackathonArc, SixStarRoadmap, Colosseum submission, Monetization strategy |

The Attestcoin layer is the new integration: have the Verifier write milestones and commitments as Attestcoin attestations, and have the Underwriter read those attestations to price credit.

## Demo Scope

For the Sept 13 deadline, build one vertical slice:

1. Builder marks a milestone complete.
2. Verifier writes the milestone to Attestcoin.
3. Underwriter queries Attestcoin and returns a credit score.
4. UI shows the Attestcoin-backed score on the project page.

Scout and Rebalance stay in the code but are out of demo scope.

---

## Attestcoin Integration Plan

1. **Milestone attestation (Verifier)** — when a builder marks a milestone complete, the Verifier agent writes an Attestcoin attestation. The attestation becomes the canonical proof that work was delivered.
2. **Credit scoring (Underwriter)** — the Underwriter agent reads the milestone attestation from Attestcoin and includes it in the credit score for the project.
3. **Backer commitment attestation (stretch)** — record cross-chain backer stakes on Creditcoin/Attestcoin so the Underwriter can price the credit line with verified backing data.
4. **UI signal** — project pages and the Underwriter report surface that the score is Attestcoin-backed.

Out of scope for the hackathon: full replacement of the LI.FI bridge path, Scout integration, and Rebalance.

---

## Prize ROI

- **Grand Prize $10,000** + top 3 fast-track into the Creditcoin Ecosystem Investment Program.
- **CertiK audit credits** for all winners — a strong fit for a credit platform that needs security credibility.
- The integration is incremental, not a rebuild: we add Attestcoin as the verification oracle on top of existing credit, agent, and cross-chain infrastructure.

Deadline is tight but the product is already cross-chain and credit-native; the Attestcoin integration is the missing trustless verification layer.
