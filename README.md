# Proof of Ship — Builder Credit Platform

Decentralized platform where backers fund builders and hackathon prizes collateralize credit. AI agents analyze projects via x402 nanopayments on Circle's Arc network.

## Features

- **Explore** — Browse projects across 7 ecosystems (Arc, Celo, Base, Linea, Arbitrum, Ethereum, Optimism) with search & filtering
- **AI Agents** — Underwriter ($0.05), Scout ($0.01), Verifier ($0.01) analyze projects via x402 micropayments
- **SNS Identity** — Builders and AI agents display .sol domain names (pos-scout.sol, pos-underwriter.sol, etc.) via Solana Name Service integration
- **Private Staking** — Backers can shield stake amounts from public explorers via Cloak (UTXO shielded pool on Solana)
- **AI Chat Assistant** — Floating helper widget powered by Featherless AI (DeepSeek-V3) with AIsa fallback, collapsible/dismissable
- **Local-First AI** — QVAC (Tether) on-device inference option keeps project data private; falls back to cloud providers when unavailable
- **Submit Projects** — GitHub auto-populate, collapsible optional sections, localStorage draft saving
- **Back Projects** — Nanopayment widget with live transaction feed and balance tracking
- **Onboarding** — Dismissible 3-step walkthrough for first-time visitors
- **SEO & Sharing** — Open Graph meta tags, X/Farcaster share buttons on project pages

## AI Provider Chain

The chat assistant uses a cascading provider strategy:

1. **Featherless AI** (primary) — DeepSeek-V3-0324 via OpenAI-compatible API. Set `FEATHERLESS_API_KEY`.
2. **AIsa x402** (fallback) — Perplexity Sonar via x402 nanopayment. Set `OWS_MNEMONIC`.
3. **Contextual replies** (offline fallback) — Pattern-matched responses, no API key needed.

## Quick Start

```bash
npm run setup        # install all dependencies
npm run dev          # frontend dev server
npm run blockchain:test  # run contract tests
```

## On-Chain (Solana Devnet)

**Program:** `14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K` ([Explorer](https://explorer.solana.com/address/14uLETygxjh89fHFwYUaRRhHE9E9XrYcSh6SsF8SEw1K?cluster=devnet))
**IDL:** `HGBAP7xUeuR3Nt99z8d2AhNDFGK5iN5sVdGd4W9jrdHr`

7 confirmed transactions on devnet — Treasury init, 2 projects created, 2 backings, milestone verification, loan repayment. Run `cd blockchain-solana && npm run tx:devnet` to reproduce.

## Environment Variables

```env
# AI Providers
FEATHERLESS_API_KEY=your_featherless_key    # Featherless AI (primary)
OWS_MNEMONIC=your_mnemonic                  # AIsa x402 (fallback)

# Circle x402 Nanopayments
CIRCLE_GATEWAY_WALLET_ADDRESS=0x...
PRIVATE_KEY=0x...
NEXT_PUBLIC_DEMO_MODE=true                  # true for testing without real keys

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Structure

- `frontend/` — Next.js app (pages, components, contexts, services)
- `blockchain/` — Hardhat workspace (Solidity contracts, deploy scripts, tests)
- `snap-server/` — Farcaster Snap server (scout + celebration snaps)
- `docs/` — [Documentation](./docs/README.md), [hackathon submission](./docs/HACKATHON_ARC.md), [changelog](./docs/CHANGELOG.md)

## Links

- **Live:** [proofofship.web.app](https://proofofship.web.app)
- **Mirror:** [proof-of-ship.vercel.app](https://proof-of-ship.vercel.app)

## License

MIT
