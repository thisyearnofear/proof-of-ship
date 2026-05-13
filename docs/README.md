# Builder Credit Platform

Decentralized platform where backers fund builders and hackathon prizes collateralize credit.

> **New:** See [VISION.md](./VISION.md) for the unified capital-stack narrative (Bags Token → x402 Credit → Prize Routing) and how the agentic layer prices, scouts, and verifies across all three rails.
>
> **Arc update:** See [HACKATHON_ARC.md](./HACKATHON_ARC.md) for the current Arc agent integration, including the simplified `setup → analyze → review` flow, explicit demo/live payment states, and result-source metadata.

## How It Works

1. **Backers** stake USDC on builders with 1.5x, 2x, or 3x reward multipliers.
2. **Builders** pledge expected hackathon prizes to collateralize their credit line.
3. **Market confidence** (total backing) determines the builder's credit limit.
4. **AI analysis** helps users decide what to back, with small USDC payments settling on Arc.
5. **Prize wins** are routed through the platform to automatically repay backers (principal + interest), then the builder.

## Architecture

```
/
├── frontend/             # Next.js app
│   └── src/
│       ├── components/   # UI components
│       ├── config/       # Environment config
│       ├── contexts/     # React context providers
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Integrations (LiFi, Dune, GitHub analytics, Arc payment middleware)
│       ├── pages/        # Next.js pages + API routes
│       ├── services/     # Business logic (Circle, Solana credit, Cloak privacy, SNS identity, QVAC local AI)
│       └── utils/        # Utilities
│
├── blockchain/           # Hardhat workspace
├── snap-server/          # Hono-based Farcaster Snap server
└── docs/                 # Documentation
```

## Current Arc Agent UX

The main happy path is now:
1. Open **Back → Discover**
2. Run **Scout** or open **AI Agents**
3. Use **demo** or **live** payment mode
4. Review the returned `status`, `resultSource`, and `nextAction`
5. Decide whether to back the project

The UI now avoids ambiguous progress states and makes it clear when a result came from:
- live AI
- cache
- demo mode
- fallback logic
- rule-based logic

## Key Frontend Routes

| Route | Who | What |
|-------|-----|------|
| `/` | Everyone | Landing page |
| `/shippers` | Everyone | Project explorer |
| `/credit` | Builders | Credit profile |
| `/dashboard` | Builders | Unified builder dashboard |
| `/back` | Backers | Discover + AI analysis workspace |
| `/admin/war-room` | Verifiers | Milestone verification dashboard |

## Integrations

- **Circle / Arc** — USDC settlement and nanopayment-backed agent calls
- **MetaMask SDK** — wallet connection
- **Solana Name Service (SNS)** — .sol identity
- **Cloak** — private USDC transfers
- **QVAC** — local-first on-device AI inference
- **Firebase** — auth + Firestore
- **GitHub API** — repo analytics and identity verification

## Setup

### Prerequisites
- Node.js (see `.nvmrc`)
- MetaMask or another Web3 wallet

### Install & Run

```bash
npm run setup
npm run dev
```

### Frontend checks

```bash
cd frontend
npm test -- --run src/lib/__tests__/agentIdentity.test.ts
./node_modules/.bin/tsc --noEmit
```

## License

MIT
