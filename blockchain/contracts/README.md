# Builder Credit Smart Contracts

This directory contains the smart contracts for the Builder Credit platform.

## Current Implementation

The current implementation uses a streamlined approach with two main contracts:

- `BuilderCreditCore.sol` - Core contract for managing credit lines, projects, and milestones
- `HackathonRegistry.sol` - Registry contract for hackathons and their verification committees

These contracts work together to provide a complete solution for hackathon funding, milestone verification, and builder reputation management.

### Interfaces

- `IHackathonRegistry.sol` - Interface for the HackathonRegistry contract
- `IBuilderCredit.sol` - Interface definitions for the Builder Credit system

### Mock Contracts

- `MockUSDC.sol` - Mock USDC token for testing

## Legacy Implementation

The following contracts are from a previous implementation that used a more modular approach:

- `BuilderCreditFactory.sol` - Factory contract for deploying the Builder Credit system
- `BuilderCreditScoring.sol` - Handles credit scoring and reputation
- `BuilderCreditSecurity.sol` - Manages access control and security
- `BuilderCreditStorage.sol` - Handles data storage for the Builder Credit system

## Testing

Each implementation has its own test files in the `/test` directory:

- Current implementation: `BuilderCreditCore.test.js` and `HackathonRegistry.test.js`
- Legacy implementation: `BuilderCredit.test.js`

## Architecture

For more details on the architecture of the current implementation, see `docs/ARCHITECTURE.md`.
