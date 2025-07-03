# Builder Credit Platform

Decentralized platform for hackathon funding and milestone verification.

## Project Structure

This project is organized as a monorepo with two main components:

```
/
├── frontend/               # Next.js frontend application
│   ├── public/
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
