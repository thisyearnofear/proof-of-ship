# Technical Documentation

This document provides a technical overview of the Proof of Ship platform, including architecture, contract implementation, and integration details. It also outlines technical issues and their recommended solutions.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Smart Contract System](#smart-contract-system)
3. [External Integrations](#external-integrations)
4. [Credit Scoring System](#credit-scoring-system)
5. [API Architecture](#api-architecture)
6. [Environment Configuration](#environment-configuration)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)
9. [Deployment Guide](#deployment-guide)
10. [Circle Integration](#circle-integration)
11. [Cross-Chain Functionality](#cross-chain-functionality)
12. [USDC Payment Service](#usdc-payment-service)

## System Architecture

### Current Implementation

The system is built on a stack of:

- **Frontend**: Next.js with React, Tailwind CSS for styling
- **Backend**: Firebase Firestore for data storage, Firebase Hosting for deployment
- **Authentication**: Firebase Auth for GitHub login, MetaMask for wallet connection
- **Data Sources**: GitHub API (via proxy), Blockchain data (via providers)

### Component Structure

```
App
├── MetaMaskProvider (Wallet connection)
├── CircleWalletProvider (USDC payments)
├── LiFiProvider (Cross-chain transfers)
├── AuthProvider (Firebase auth)
├── GithubProvider (Project data)
└── ThemeProvider (UI theming)
```

### Data Flow

1. **Project Data Flow**:

   ```
   repos.json → load.js → data/github-data/ → Firebase → Dashboard
   ```

2. **Funding Flow**:

   ```
   User Wallet → MetaMask SDK → Circle API → USDC Transfer
   ```

3. **Credit Scoring Flow**:

   ```
   GitHub Data + Wallet Activity → Credit Calculation → Funding Eligibility
   ```

4. **Cross-Chain Transfer Flow**:
   ```
   Source Chain → LI.FI SDK → Bridge Selection → Destination Chain
   ```

## Smart Contract System

### BuilderCredit.sol Analysis

The current smart contract implementation has several critical issues:

1. **Centralization Issues**:

   - Milestone verification relies on a single owner address
   - No DAO or community governance mechanisms
   - Funding approvals are centralized

2. **Missing Functionality**:

   - No actual on-chain reputation mechanism
   - Missing implementation for several declared functions
   - Limited error handling and validation

3. **Security Concerns**:
   - No emergency withdrawal functionality
   - No circuit breaker mechanisms
   - No timelock for sensitive operations
   - Insufficient access controls

### Required Contract Improvements

1. **Decentralization**:

   - Implement multi-signature requirements for milestone verification
   - Create DAO voting mechanism for protocol decisions
   - Develop community governance for parameter adjustments

2. **On-Chain Reputation**:

   - Implement a reputation token or soulbound NFT
   - Create verifiable credential system for developer achievements
   - Develop on-chain attestation mechanisms

3. **Security Enhancements**:
   - Add emergency pause functionality
   - Implement timelocks for sensitive operations
   - Create comprehensive access control system
   - Add proper event emission for all state changes

## External Integrations

### MetaMask SDK Integration

**Current Status**: Basic integration with significant gaps.

**Issues**:

- Hardcoded USDC token address that doesn't exist on any network
- Incomplete network detection and switching
- Missing transaction status tracking
- No proper error handling

**Implementation Plan**:

1. Replace hardcoded token addresses with network-specific constants
2. Implement proper network detection and switching
3. Add transaction status tracking and notifications
4. Implement comprehensive error handling

### Circle API Integration

**Current Status**: Mock implementation with no real functionality.

**Issues**:

- Using a fake Circle SDK instead of actual API integration
- No validation of API keys or environment variables
- No proper error handling or retry logic

**Implementation Plan**:

1. Implement actual Circle API SDK
2. Add proper validation for API keys and environment
3. Implement error handling and retry logic
4. Add webhook handlers for Circle events

### LI.FI Integration

**Current Status**: Non-functional implementation.

**Issues**:

- Broken `executeTransfer` method
- Missing execution logic
- No proper error handling or status tracking

**Implementation Plan**:

1. Fix the `executeTransfer` method with proper execution logic
2. Implement proper error handling
3. Add transaction status tracking
4. Create user-friendly status notifications

## Credit Scoring System

### Current Implementation

The current credit scoring system is entirely simulated with no real logic:

```javascript
const calculateFundingAmount = (score) => {
  if (score < 400) return 0;
  if (score >= 800) return 5000;

  const minFunding = 500;
  const maxFunding = 5000;
  const range = maxFunding - minFunding;
  const scoreRange = 800 - 400;
  const adjustedScore = score - 400;

  return Math.floor(minFunding + (range * adjustedScore) / scoreRange);
};
```

### Proposed Implementation

A robust credit scoring system should:

1. **Gather Real Data**:

   - GitHub contributions (commits, PRs, issues)
   - On-chain activity (transactions, contract deployments)
   - Social protocol participation (Farcaster, Lens)

2. **Apply Weighted Scoring**:

   - GitHub metrics (40%): Commit frequency, code quality, PR reviews
   - Social reputation (30%): Community engagement, technical discussions
   - On-chain activity (20%): Contract deployments, DeFi interactions
   - Project milestones (10%): Feature completion, documentation

3. **Implement Security Measures**:
   - Sybil resistance through multi-factor verification
   - Temporal analysis to prevent gaming the system
   - Peer validation mechanisms

## API Architecture

### Current Endpoints

```
/api/github/[...proxy].js - Proxies GitHub API requests
/api/funding.js - Handles funding operations (currently mock)
```

### Required Improvements

1. **API Security**:

   - Implement proper rate limiting
   - Add request validation
   - Set up proper authentication and authorization

2. **New Endpoints**:

   - `/api/credit` - Calculate and retrieve credit scores
   - `/api/projects` - Project CRUD operations
   - `/api/reputation` - Access reputation data
   - `/api/transactions` - Track and manage transactions

3. **Error Handling**:
   - Standardized error responses
   - Detailed logging
   - Retry mechanisms for external services

## Environment Configuration

### Required Variables

```
# GitHub Integration
GITHUB_TOKEN=

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Circle API Integration
NEXT_PUBLIC_CIRCLE_CLIENT_KEY=
CIRCLE_API_KEY=
CIRCLE_ENVIRONMENT=sandbox
CIRCLE_PLATFORM_WALLET_ID=
CIRCLE_WALLET_SET_ID=
CIRCLE_ENTITY_SECRET=

# Contract Addresses
NEXT_PUBLIC_BUILDER_CREDIT_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=
```

### Environment Management

1. Implement proper validation for all environment variables
2. Add fallback mechanisms for non-critical variables
3. Create separate configurations for development, testing, and production
4. Implement secrets management for production

## Testing Strategy

### Required Test Coverage

1. **Smart Contract Tests**:

   - Unit tests for all contract functions
   - Integration tests for contract interactions
   - Fuzz testing for edge cases
   - Security-focused tests for vulnerabilities

2. **Frontend Tests**:

   - Component tests with React Testing Library
   - Integration tests for API interactions
   - End-to-end tests for critical user flows

3. **API Tests**:
   - Unit tests for API controllers
   - Integration tests with mock databases
   - Performance tests for high-load scenarios

### CI/CD Pipeline

1. Set up GitHub Actions for automated testing
2. Implement contract verification in deployment process
3. Add automated security scanning
4. Create deployment pipelines for different environments

## Performance Considerations

1. **Data Caching**:

   - Implement Redis or similar for API response caching
   - Use client-side caching for frequent requests
   - Add background refresh for critical data

2. **Optimization**:

   - Implement code splitting and lazy loading
   - Optimize bundle size
   - Add performance monitoring
   - Implement server-side rendering for critical pages

3. **Scalability**:
   - Design for horizontal scaling
   - Implement database sharding strategy
   - Add load balancing for high-traffic scenarios

## Deployment Guide

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Hardhat
- MetaMask or another Ethereum wallet
- USDC token contract address for the target network

### Smart Contract Deployment

#### Local Development

1. Start a local Hardhat node

   ```bash
   npx hardhat node
   ```

2. Deploy contracts to local node

   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. Note the contract addresses output from the deployment script.

#### Testnet Deployment

1. Deploy to a testnet (e.g., Goerli, Sepolia)

   ```bash
   # For Goerli
   npx hardhat run scripts/deploy.js --network goerli

   # For Sepolia
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. Verify contracts on Etherscan (optional but recommended)
   ```bash
   npx hardhat verify --network goerli CORE_CONTRACT_ADDRESS
   ```

#### Mainnet Deployment

1. Deploy to Ethereum mainnet

   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

2. Verify contracts on Etherscan

### Frontend Deployment

#### Deploying to Vercel

1. Connect your repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Deploy the application

#### Deploying to Firebase Hosting

```bash
npm run deploy
```

### Post-Deployment Steps

1. Transfer admin roles to secure multisig wallets
2. Add initial verifiers
3. Set up credit factors
4. Configure minimum funding thresholds

### Emergency Procedures

In case of emergency (e.g., contract vulnerability discovered):

1. Execute the emergency stop function to pause critical operations
2. Assess the situation and develop a mitigation plan
3. Implement fixes and test thoroughly
4. Resume operations once issues are resolved

## Circle Integration

### Circle API Architecture

The Circle API integration is built with a secure, server-side architecture:

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   Frontend    │      │  Next.js API  │      │  Circle API   │
│  Application  │ ───> │   Endpoints   │ ───> │    Services   │
│  (Browser)    │      │  (Server)     │      │  (External)   │
└───────────────┘      └───────────────┘      └───────────────┘
       │                      │                      │
       │                      │                      │
       ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│CircleWalletCtx│      │   Security    │      │   Response    │
│   React       │      │   Rate        │      │   Data        │
│   Context     │      │   Limiting    │      │   Processing  │
└───────────────┘      └───────────────┘      └───────────────┘
```

### API Endpoints

- `/api/circle/config` - Provides wallet configuration to the frontend
- `/api/circle/status` - Checks API status and connectivity
- `/api/circle/transactions` - Handles transaction creation and retrieval
- `/api/circle/wallets` - Manages wallet creation and listing
- `/api/circle/wallets/[id]` - Handles individual wallet operations
- `/api/circle/wallets/[id]/balances` - Retrieves wallet balances

### Security Measures

- **Rate Limiting**: All API endpoints are protected with rate limiting
- **Server-Side Secrets**: API keys and sensitive credentials kept on server
- **Request Validation**: All requests are validated before processing
- **Error Handling**: Comprehensive error handling with appropriate status codes

### Setup Instructions

#### Required Environment Variables

| Variable               | Description                             | Required                 | Example                                         |
| ---------------------- | --------------------------------------- | ------------------------ | ----------------------------------------------- |
| `CIRCLE_API_KEY`       | Circle API Key (server-side only)       | Yes                      | `SAND_API-KEY-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `CIRCLE_WALLET_SET_ID` | Wallet Set ID                           | Yes                      | `wallet-set-xxxxxxxxxxxxxxxxxxxx`               |
| `CIRCLE_ENTITY_SECRET` | Entity Secret for wallet creation       | Yes                      | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`              |
| `CIRCLE_ENVIRONMENT`   | API Environment (sandbox or production) | No (defaults to sandbox) | `sandbox`                                       |

#### Configuration Steps

1. Create a Circle Developer Account
2. Create a Wallet Set
3. Configure environment variables

## Cross-Chain Functionality

### Architecture

The cross-chain transfer functionality is built with the following components:

1. **LiFiContext**: A React context provider that manages the LI.FI SDK integration
2. **CrossChainTransfer**: UI component for initiating transfers
3. **TransferHistory**: UI component for tracking and managing transfer history

### Integration Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MetaMaskContext │     │   LiFiContext   │     │ BuilderCredit   │
│  (Wallet & Chain)│────▶│(Bridge & Routes)│────▶│    Context      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          ▲                      ▲                      ▲
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Dashboard                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              ▼
┌─────────────────┐     ┌─────────────────┐
│ CrossChainTransfer│     │ TransferHistory │
│    Component     │────▶│    Component    │
└─────────────────┘     └─────────────────┘
```

### Chain Support

The integration supports multiple chains including Ethereum, Polygon, Optimism, Arbitrum, BSC, Avalanche, Celo, and Base.

### Transfer Process

1. **Initiate Transfer**: Select source chain, destination chain, and amount
2. **Quote Generation**: Get available routes, calculate fees and estimated time
3. **Transfer Execution**: Handle network switching, token approvals, execute transfer
4. **Status Tracking**: Track transfer status and update history

## USDC Payment Service

### Features

- **Developer Funding**: Credit score-based funding calculations and transfers
- **Wallet Management**: Create and manage Circle wallets
- **Transfer Operations**: Send USDC to blockchain addresses
- **Multi-chain Support**: Ethereum and Polygon networks
- **Mock Mode**: Development-friendly fallbacks when APIs aren't configured
- **Comprehensive Validation**: Address validation and error handling

### API Usage

#### Core Service Methods

```javascript
// Process funding for developers based on credit score
const result = await usdcPaymentService.processDeveloperFunding(
  "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  720,
  { githubUsername: "developer123" }
);

// Calculate funding amount based on credit score
const amount = usdcPaymentService.calculateFundingAmount(720);

// Create a new Circle wallet for a user
const wallet = await usdcPaymentService.createWallet("user123");

// Transfer USDC between wallets
const transfer = await usdcPaymentService.transferUSDC(
  "source-wallet-id",
  "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "100"
);
```

### Credit Score Funding Matrix

| Credit Score Range | Funding Amount | Tier       | Color  |
| ------------------ | -------------- | ---------- | ------ |
| 800-850            | $5,000         | Excellent  | Green  |
| 700-799            | $2,500-$4,500  | Good       | Blue   |
| 600-699            | $1,500-$2,500  | Fair       | Yellow |
| 500-599            | $750-$1,500    | Poor       | Orange |
| 400-499            | $500-$750      | Very Poor  | Red    |
| Below 400          | $0             | Ineligible | Red    |

### Security Considerations

- API keys are validated before operations
- Wallet addresses are validated using regex patterns
- All transfers include idempotency keys
- Environment-specific chain selection
- Comprehensive error logging

### Development vs Production

**Development Mode:**

- Uses mock transfers when API keys aren't configured
- Provides detailed console logging
- Falls back gracefully for demo purposes

**Production Mode:**

- Requires valid Circle API keys
- Uses real blockchain networks
- Implements proper error handling and retries
