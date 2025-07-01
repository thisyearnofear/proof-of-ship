# Project Roadmap: The Builder-Centric Credit Protocol

This document outlines the strategic evolution of the Proof of Ship platform from a project tracking dashboard into a decentralized, builder-centric credit and funding protocol.

## 1. Core Vision

The goal is to create a system where developers can leverage their multi-faceted reputation (code, social presence, on-chain history) to access instant, non-dilutive capital for building. The key principles are:

- **Builder-Centric**: Empower individual developers and small teams to register their own projects.
- **Multi-Chain Native**: Operate seamlessly across multiple blockchain ecosystems.
- **Holistic Reputation**: Utilize a sophisticated credit score based on GitHub, social protocols (Farcaster, Lens), and on-chain activity.
- **Innovative Repayment**: Pioneer a model where loans are backed by hackathon partners and success, not just personal liability.

## 2. Architectural Evolution & Key Concepts

To achieve this vision, we will evolve the existing architecture. Here’s how the concepts you raised map to our technical strategy:

### a. Multi-Chain Architecture

- **Current State**: The plan for multi-chain support and LI.FI integration is documented in `HACKATHON.md`.
- **Path Forward**:
  1.  **Smart Contracts**: The `BuilderCredit` contract (outlined in `TECHNICAL.md`) must be designed for deterministic, multi-chain deployment (e.g., using `CREATE2`).
  2.  **Credit Scoring**: The on-chain analysis component of the credit score must aggregate data from multiple chains for a single developer identity. This requires robust RPC connections and data indexing.
  3.  **Frontend**: The UI will need a seamless network switcher and must clearly display multi-chain assets and activities associated with a user's profile.
  4.  **Cross-Chain Distribution**: Prioritize the LI.FI SDK integration (planned in Phase 4) to enable funding distribution on any supported chain, regardless of where the credit was scored.

### b. On-Chain Project Registration (Moving from Hardcoded to Dynamic)

- **Current State**: Projects are currently hardcoded or added manually by an admin.
- **Path Forward**:
  1.  **Smart Contract Function**: Introduce a `registerProject()` function to the `BuilderCredit` contract. This function will require builders to stake a nominal amount of a stablecoin (e.g., USDC) to register a project. This stake acts as a sybil-resistance mechanism.
  2.  **Stake & Slashing**: The stake can be returned upon meeting a minimum progress threshold (e.g., 10 commits and a deployed contract) or slashed if the project is abandoned. This logic will be encoded in the smart contract.
  3.  **UI/UX Flow**: Create a new section in the dashboard for project registration. This will be a simple form where builders connect their wallet, provide a project name and GitHub repository link, and submit the staking transaction.

### c. Refining the Credit Eligibility Engine

- **Current State**: A solid foundation exists with the multi-protocol scoring model (GitHub 40% + Social 30% + On-chain 20% + Identity 10%).
- **Path Forward**:
  1.  **Deepen On-Chain Analysis**: Go beyond transaction history. Analyze the _quality_ of on-chain interactions: gas spent, interaction with developer-focused protocols (e.g., The Graph, Chainlink), smart contract complexity, and mainnet vs. testnet deployments.
  2.  **Strengthen Identity Verification**: Implement a robust cross-protocol identity verification system. This could involve requiring a user to sign a message with their wallet that includes their GitHub handle, Farcaster FID, and Lens handle, creating a verifiable link between their identities.
  3.  **Dynamic Weighting**: In the long term, the credit score model could dynamically adjust weights based on the type of project or the developer's area of expertise.

### d. Implementing the Innovative Repayment Model

- **Current State**: The concept is documented, and the `BuilderCredit` contract has placeholders like `repaidByHackathon` and a `verifyMilestone` function stub.
- **Path Forward**:
  1.  **Partner Funding Pool**: Create a mechanism for hackathon partners to deposit capital into a central funding pool within the `BuilderCredit` smart contract. This pool will underwrite the loans.
  2.  **Milestone Oracle**: Define the "oracle" for milestone verification. This could start as a multi-sig of trusted parties (hackathon judges, project admins) who can call the `verifyMilestone` function. In the future, this could be automated by an on-chain service that programmatically checks for GitHub commits or contract deployments.
  3.  **Loan Rollover Logic**: The `Loan` struct in the smart contract will be updated to include a `hackathonId` and a `status` field (e.g., `Active`, `Repaid`, `RolledOver`). This allows a loan's lifecycle to extend beyond a single event.

## 3. Revised Development Phases

Based on this, we can revise the project's roadmap:

- **Phase 3 (Revised): Smart Contracts & On-Chain Registration**

  - [ ] Implement `registerProject()` with staking/slashing logic in the `BuilderCredit` contract.
  - [ ] Build the UI/UX for builder-driven project registration.
  - [ ] Refine the `verifyMilestone` function and establish the initial oracle mechanism (e.g., admin-based).
  - [ ] Deploy initial version of the contract to a testnet.

- **Phase 4 (Revised): Partner Integration & Repayment Logic**

  - [ ] Implement the partner funding pool functionality in the smart contract.
  - [ ] Build a simple interface for partners to deposit and manage funds.
  - [ ] Implement the full loan lifecycle logic, including repayment by the hackathon pool and the rollover mechanism.
  - [ ] Deepen the on-chain components of the credit scoring engine.

- **Phase 5 (Revised): Full Multi-Chain Deployment & Ecosystem Growth**
  - [ ] Integrate the LI.FI SDK for seamless cross-chain funding distribution.
  - [ ] Deploy the finalized smart contracts to multiple mainnets (e.g., Ethereum, Linea, Base, Polygon).
  - [ ] Onboard the first cohort of hackathon partners and builders.
  - [ ] Develop comprehensive documentation for builders and partners.
