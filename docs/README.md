# Builder Credit Platform

Decentralized platform where backers fund builders and hackathon prizes collateralize credit.

> **New:** See [VISION.md](./VISION.md) for the unified capital-stack narrative (Bags Token → x402 Credit → Prize Routing) and how the agentic layer prices, scouts, and verifies across all three rails.
>
> **Hackathon:** See [COLOSSEUM_SUBMISSION.md](./COLOSSEUM_SUBMISSION.md) for the Frontier Hackathon Public Goods submission, including the new on-chain SNS identity-proof flow, Cloak Privacy, and QVAC Local-First AI track eligibility.

## How It Works

1. **Backers** stake USDC on builders with 1.5x, 2x, or 3x reward multipliers.
2. **Builders** pledge expected hackathon prizes to collateralize their credit line.
3. **Market confidence** (total backing) determines the builder's credit limit.
4. **Prize wins** are routed through the platform to automatically repay backers (principal + interest), then the builder.

## Architecture

```
/
├── frontend/             # Next.js app
│   └── src/
│       ├── components/   # UI components
│       ├── config/       # Environment config
│       ├── contexts/     # React context providers
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Integrations (LiFi, Dune, GitHub analytics)
│       ├── pages/        # Next.js pages + API routes
│       ├── services/     # Business logic (Circle, Solana credit, Cloak privacy, SNS identity, QVAC local AI)
│       └── utils/        # Utilities
│
├── blockchain/           # Hardhat workspace
│   ├── contracts/        # Solidity (BuilderCreditCore, HackathonRegistry, etc.)
│   ├── scripts/          # Deploy scripts
│   └── test/             # Contract tests
│
├── snap-server/          # Hono-based Farcaster Snap server
│   └── src/snaps/        # Scout + Celebration snaps
│
└── docs/                 # This directory
```

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `BuilderCreditCore` | Credit lines, funding requests, milestone tracking, backer payouts |
| `BuilderCreditStorage` | Separated storage for upgradeability |
| `BuilderCreditScoring` | On-chain reputation scoring |
| `BuilderCreditSecurity` | Access control and security checks |
| `BuilderCreditFactory` | Deploys new credit instances |
| `HackathonRegistry` | Hackathon registration and prize tracking |
| `MockUSDC` | Test token for local/testnet development |

### Key Frontend Routes

| Route | Who | What |
|-------|-----|------|
| `/` | Everyone | Landing page |
| `/shippers` | Everyone | Project explorer |
| `/hackathons` | Everyone | Browse hackathons |
| `/credit` | Builders | Credit profile (score, credit line, backings) |
| `/dashboard` | Builders | Unified builder dashboard |
| `/expedition` | Backers | Backer marketplace |
| `/backer-portfolio` | Backers | Backing positions and returns |
| `/admin/war-room` | Verifiers | Milestone verification dashboard |
| `/fleet` | Everyone | Fleet overview |

### Integrations

- **MetaMask SDK** — wallet connection
- **Solana Name Service (SNS)** — .sol domain identity for builders and AI agents, including signed ownership proof in the Solana project-creation flow
- **Cloak** — Private (shielded) USDC transfers for backer staking
- **QVAC** — Local-first on-device AI inference (Tether) for privacy-preserving project analysis
- **Circle** — USDC programmable wallets and funding
- **LI.FI** — cross-chain transfers
- **Firebase** — auth, Firestore, hosting
- **GitHub API** — repo analytics and identity verification

## Setup

### Prerequisites

- Node.js (see `.nvmrc`)
- MetaMask or another Web3 wallet

### Environment Variables

Create `.env.local` in the frontend directory and `.env` in the blockchain directory:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Circle (sandbox)
CIRCLE_API_KEY=
CIRCLE_WALLET_SET_ID=
CIRCLE_ENTITY_SECRET=
CIRCLE_ENVIRONMENT=sandbox

# GitHub
GITHUB_TOKEN=

# LI.FI
NEXT_PUBLIC_LIFI_API_KEY=

# Blockchain
PRIVATE_KEY=
INFURA_API_KEY=

# Solana / SNS
NEXT_PUBLIC_SOLANA_PROGRAM_ID=
NEXT_PUBLIC_SOLANA_RPC_URL=
SNS_DOMAIN=your-name.sol
SNS_NAME_ACCOUNT=
```

### Solana Proof Flow

For the latest proof-aware Solana flow:

```bash
cd blockchain-solana
anchor build
npm run idl:copy
npm run treasury:init
SNS_DOMAIN=your-name.sol npm run tx:devnet
```

The updated Solana tests also expect `SNS_DOMAIN` and `SNS_NAME_ACCOUNT` so they can validate a real SNS name account instead of a UI-only alias.

### Install & Run

```bash
# Install everything
npm run setup

# Frontend dev server
npm run dev

# Local blockchain
npm run blockchain:node
npm run blockchain:compile
npm run blockchain:deploy:local

# Contract tests
npm run blockchain:test
```

### Deploy

```bash
# Frontend → Firebase
npm run build && npm run deploy

# Contracts → testnet
npm run blockchain:deploy:sepolia
```

## Deployment

- **Primary:** [proofofship.web.app](https://proofofship.web.app) (Firebase)
- **Secondary:** [proof-of-ship.vercel.app](https://proof-of-ship.vercel.app) (Vercel, auto-deploys from main)

## License

MIT
