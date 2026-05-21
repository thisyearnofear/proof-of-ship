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
| **Rebalance** (`pos-rebalance.sol`) | $0.01 | Portfolio optimization across hackathon groups |

Each agent earns per-call via x402 nanopayments on Arc — zero gas, sub-second settlement.

### Identity Layer

- **SNS (.sol domains)** — Builders and agents use human-readable on-chain identities via Solana Name Service integration. A builder named `alice.sol` is more legible than `7xKX...4pQr`.
- **Anchored builder identity proof** — In the latest Solana project-creation flow, the builder signs an SNS identity-claim message, the transaction prepends an `Ed25519Program` verification instruction, and the Anchor program stores the claimed `.sol` domain, SNS name-account reference, and proof signature on the `Project` account.
- **Agent identities** — Each AI agent has a registered .sol domain on devnet (`pos-scout.sol`, `pos-underwriter.sol`, `pos-verifier.sol`, `pos-rebalance.sol`) providing verifiable on-chain identity for machine-to-machine transactions. All 4 registered by the project wallet.

### Privacy Layer

- **Cloak shielded transfers** — Backers' stake amounts are protected by default via Cloak's UTXO shielded pool on Solana with Groth16 proofs generated client-side. Privacy is a platform feature, not a user toggle.
- **Privacy-first onboarding** — First-time backers see a 3-step interactive walkthrough explaining public vs shielded explorer views. "Positions Shielded" badges appear throughout the back flow.
- **Inline guarantees** — The backing modal shows "Your stake amount is shielded — other users won't see your position" right before confirmation. No configuration needed.
- **Demo mode** — On devnet, the exact Cloak SDK flow is demonstrated with real method signatures. On mainnet, the same code path executes real shielded transactions.

### Local-First AI

- **QVAC by Tether** — Our inference layer is provider-agnostic with QVAC as the preferred provider. When a user runs `qvac serve` locally, analysis runs on their GPU via an OpenAI-compatible HTTP API — project data never leaves their machine. When QVAC isn't running, the same prompts and scoring structure are served by Featherless cloud. The `/analyze` page auto-detects which provider is available and shows a clear "On-Device (QVAC)" vs "Cloud API (Featherless)" badge. The same architecture powers the AI agents (Scout, Underwriter, Verifier).

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

## On-Chain Proof (Solana Devnet)

The Anchor program is deployed and all core flows are confirmed on-chain:

**Program:** [`14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K`](https://explorer.solana.com/address/14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K?cluster=devnet)
**IDL Account:** `HGBAP7xUeuR3Nt99z8d2AhNDFGK5iN5sVdGd4W9jrdHr`

| # | Action | Transaction |
|---|--------|-------------|
| 1 | Initialize Treasury | [`52cABYik...`](https://explorer.solana.com/tx/52cABYiksd61xwer2NRZjCeJeuQHddczoUTw4FerT3B9zSH3RQXY4fxR1CeLFzUUA32T8EUZorXQDGkN9ZREh5Qj?cluster=devnet) |
| 2 | Create Project (2 milestones) | [`VHg3MJrL...`](https://explorer.solana.com/tx/VHg3MJrLC13PwQdkzfEmKLURgoXJuLwKy9YpFPCA9R379Vwb5SBzgUXWYZKNCJdddG9QRC3EuHhUf1KGz87z8WH?cluster=devnet) |
| 3 | Back Project (5 USDC, 2x) | [`5NrNXSct...`](https://explorer.solana.com/tx/5NrNXSctnrzZizR1WrPVAJcXrVrnd5uEkJJT8b5UZR3gjfqvuCDBaJ7GSPJJjTPVrwj2SkVf4hHGUqMcUyjg5iLc?cluster=devnet) |
| 4 | Verify Milestone + Pay Dev | [`DUPX3M7q...`](https://explorer.solana.com/tx/DUPX3M7q7AfZCDMJ3MDEaa3n5id4VD35AX6hheD97FbnBsPkobLSyjqwoJMSK6YriZXUnbMwxuZdNj8vWpC7f9W?cluster=devnet) |
| 5 | Repay Loan to Treasury | [`4Bw4e8z7...`](https://explorer.solana.com/tx/4Bw4e8z7P2M9Zun854MtL1XXcJ2UDhXiZAMPyn75a4GbR7Pp2jbzniTHv6DQbDSkMwejSXNjAiWUHiav3RHpxGFv?cluster=devnet) |
| 6 | Create Project 2 (3 milestones) | [`5d4uUk8g...`](https://explorer.solana.com/tx/5d4uUk8gKRBdnBTV9qEHPZL8DKW7fNwGmcPHexRXRL61rkZFwH7p6rptGKW9n3kDBWC5bUtgGsMPA13q9LRWkryh?cluster=devnet) |
| 7 | Back Project 2 (3 USDC, 3x) | [`4WCdiM9N...`](https://explorer.solana.com/tx/4WCdiM9NB98pYTWWbt3YUc5dfwDVZBJ7QjRt8D4zTVvKQZNfyqVfhEgcGxHJZsXL1p9ioyZDq9Zryqc3mLiU9exF?cluster=devnet) |

All transactions above are verifiable on Solana Explorer.

### Latest Repo Revision

Since those proof transactions were recorded, the Solana funding flow has been upgraded to make SNS identity load-bearing:

1. The builder resolves or supplies a `.sol` domain.
2. The wallet signs a canonical SNS identity-claim message.
3. The transaction prepends an `Ed25519Program` verification instruction.
4. The Anchor program validates the SNS name account owner/header and stores:
   - `builder_sns_domain`
   - `builder_sns_name_account`
   - `builder_identity_signature`

**Agent SNS Domain Registrations (devnet)**

All 4 AI agents have registered .sol domains on Solana devnet, owned by the project wallet:

| Agent | Domain | Registration TX |
|-------|--------|----------------|
| Scout | `pos-scout.sol` | [`3jaZHfX...`](https://explorer.solana.com/tx/3jaZHfXVkhsqths28JiHsVbzY1kSo1ZjFSwDF58vAQDrt2AF83Ty5PCav1CWVHaMSposVhAjtkz3RdFZNeVDhfGD?cluster=devnet) |
| Underwriter | `pos-underwriter.sol` | [`395H3j1...`](https://explorer.solana.com/tx/395H3j1BSFD5vk55Jcf43jqrjmYKfj9qeSrVf68WLVqAUL1gptyewwBXubtq5X6j3HXWj849cv332SaJDNSDYbkH?cluster=devnet) |
| Verifier | `pos-verifier.sol` | [`4Fa3cmL...`](https://explorer.solana.com/tx/4Fa3cmLRNznWUXPLDgvQkaQx6bAMFf4ruz9e6ZaiqHnQ8FPm4AXMzFDAdLUsBeNcan6kp8AktnLkgSWihFg2RxtL?cluster=devnet) |
| Rebalance | `pos-rebalance.sol` | [`5JYxfPs...`](https://explorer.solana.com/tx/5JYxfPsavQhdHrMkXWW4RiVJPeF2xGQm6WahQMYwva8THvhdjo8A5igqAbPdzf3Ro9YdAY9LtQsFfjTSZHHc1FSx?cluster=devnet) |

**Cloak Demo Mode**

The Cloak integration includes an interactive demo panel on the Back page that walks through the 5-step privacy flow (generate keypair, create UTXO, generate Groth16 ZK proof, submit to Solana, confirm). The demo uses the actual SDK method signatures and shows a technical toggle with code details. On mainnet, where the Cloak program is deployed, the same code path executes real shielded transactions.

**QVAC /analyze Page**

A standalone `/analyze` page demonstrates local-first AI analysis via QVAC. It loads real projects from Firestore and runs structured analysis (score, strengths, risks, recommendation) plus credit score explanation. The page auto-detects whether a local QVAC server is running (`qvac serve` on localhost) and routes inference there — project data never leaves the user's machine. When QVAC isn't available, it falls back to the Featherless cloud API with identical prompts and output structure. A source badge shows "On-Device (QVAC)" vs "Cloud API (Featherless)" so the user always knows where inference ran. The same provider chain powers the AI agent chat widget and the agent API endpoints.

To reproduce the latest flow locally after rebuilding and redeploying the Anchor program:

```bash
cd blockchain-solana
anchor build
npm run idl:copy
npm run treasury:init
SNS_DOMAIN=your-name.sol npm run tx:devnet
```

For the updated SNS-aware tests, also set:

```bash
SNS_DOMAIN=your-name.sol
SNS_NAME_ACCOUNT=your_sns_name_account_pubkey
```

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
