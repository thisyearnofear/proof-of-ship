# Builder Credit Platform

Decentralized platform for hackathon funding and milestone verification.

## Backer-Driven Liquidity Loop

The platform features a "Backer-Driven Liquidity Loop" that transforms builder credit from a static score into a dynamic, market-driven ecosystem:

1. **Simple Multiplier Betting:** Backers can "bet" on builders by staking USDC with 1.5x, 2x, or 3x reward multipliers.
2. **Prize-Collateralized Commitments:** Builders can pledge expected hackathon prizes to collateralize their credit.
3. **Automated Repayment:** When a builder wins a prize, it is routed through the platform to automatically repay backers (principal + interest) and then the builder.
4. **Market-Linked Credit Limits:** A builder's credit limit scales directly with market confidence (total amount backed by the community).

## Project Structure

This project is organized as a monorepo with two main components:

```
/
├── frontend/               # Next.js frontend application
│   ├── public/
│   ├── src/
│   └── ...
│
├── snap-server/            # Hono-based Farcaster Snap server
│   ├── src/
│   └── ...
│
├── blockchain/             # Smart contract code
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── ...
│
└── docs/                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm or yarn
- MetaMask or another Web3 wallet

### Installation

```bash
# Install all dependencies (frontend, blockchain, and root)
npm run setup
```

### Development

#### Frontend

```bash
# Start the Next.js development server
npm run dev
```

#### Blockchain

```bash
# Start a local Hardhat node
npm run blockchain:node

# In another terminal, compile contracts
npm run blockchain:compile

# Deploy contracts to local node
npm run blockchain:deploy:local

# Run tests
npm run blockchain:test
```

### Deployment

#### Frontend

```bash
# Build the frontend
npm run build

# Deploy to Firebase
npm run deploy
```

#### Contracts

```bash
# Deploy to Sepolia testnet
npm run blockchain:deploy:sepolia

# Deploy to Mumbai testnet
npm run blockchain:deploy:mumbai
```

## Documentation

See the [docs](./docs) directory for detailed documentation.

## License

MIT
