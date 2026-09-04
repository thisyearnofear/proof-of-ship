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

PledgeBond on Creditcoin — verified cross-chain credit data via Attestcoin, no centralized oracles.

Backers fund builders across 7 chains; Attestcoin verifies milestone completion, backer commitments, and creditworthiness trustlessly. AI agents price the work, scout the best projects, and underwrite risk — all using verified cross-chain data instead of bridge receipts or centralized verifiers.

---

## Why PledgeBond Is the Best Fit

PledgeBond is the only project in the catalog that is genuinely a credit platform — and BUIDL CTC is built on Creditcoin, a credit/microfinance blockchain.

### Credit-first design

- Backers fund builders with USDC on-chain.
- Hackathon prizes collateralize credit lines.
- Underwriter, Scout, and Verifier AI agents price and verify work.
- Core thesis: "Capital infrastructure for builders, powered by on-chain credit, AI agents, and community staking."

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
- **AI** — Underwriter / Scout / Verifier agents run via x402 nanopayments and consume Attestcoin-verified data.

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

The Attestcoin layer is the new integration: replace or augment LI.FI bridge verification with Attestcoin-verified cross-chain credit data, and have the agents query Attestcoin for verified project data before scoring and backing.

---

## Attestcoin Integration Plan

1. **Milestone attestation** — when a builder marks a milestone complete, submit an Attestcoin attestation from the verifier agent. The attestation becomes the canonical proof that work was delivered.
2. **Backer commitment attestation** — record cross-chain backer stakes on Creditcoin/Attestcoin so credit lines and repayment logic can be verified without centralized state.
3. **Creditworthiness feed** — Scout and Underwriter agents query Attestcoin for builder history, repayment, and cross-chain activity before generating scores and backings.
4. **Replace bridge-oracle path** — where the app currently trusts LI.FI + manual verification, use Attestcoin attestations as the trustless replacement.

---

## Prize ROI

- **Grand Prize $10,000** + top 3 fast-track into the Creditcoin Ecosystem Investment Program.
- **CertiK audit credits** for all winners — a strong fit for a credit platform that needs security credibility.
- The integration is incremental, not a rebuild: we add Attestcoin as the verification oracle on top of existing credit, agent, and cross-chain infrastructure.

Deadline is tight but the product is already cross-chain and credit-native; the Attestcoin integration is the missing trustless verification layer.
