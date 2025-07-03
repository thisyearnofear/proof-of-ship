# Builder Credit Test Suite

This directory contains tests for the Builder Credit platform's smart contracts and frontend integrations.

## Smart Contract Tests

### Current Implementation Tests

- **BuilderCreditCore.test.js** - Tests for the core contract that handles project funding, milestone verification, and credit line management
- **HackathonRegistry.test.js** - Tests for the registry contract that manages hackathons and their verification committees

### Legacy Implementation Tests

- **BuilderCredit.test.js** - Tests for the previous modular implementation with multiple component contracts

## Integration Tests

- **CircleWalletContext.test.js** - Tests for the Circle Wallet integration
- **CrossChainTransfer.test.js** - Tests for cross-chain transfer functionality

## Running Tests

Run the full test suite using:

```bash
npm test
```

Run a specific test file using:

```bash
npx hardhat test test/BuilderCreditCore.test.js
```

## Test Coverage

To generate a test coverage report:

```bash
npm run coverage
```

This will create a coverage report in the `coverage/` directory.
