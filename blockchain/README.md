# Blockchain

This directory contains the smart contracts and blockchain-related code for the Builder Credit Platform.

## Structure

- `contracts/` - Smart contract source code
- `scripts/` - Deployment and management scripts
- `test/` - Contract test files
- `hardhat.config.js` - Hardhat configuration

## Getting Started

From this directory:

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Start local node
npm run node

# Deploy to local network
npm run deploy:local

# Deploy to testnet
npm run deploy:sepolia
npm run deploy:mumbai
```

Or from the root directory:

```bash
# Install dependencies
npm run setup

# Compile contracts
npm run blockchain:compile

# Run tests
npm run blockchain:test

# Start local node
npm run blockchain:node

# Deploy to local network
npm run blockchain:deploy:local

# Deploy to testnet
npm run blockchain:deploy:sepolia
npm run blockchain:deploy:mumbai
```
