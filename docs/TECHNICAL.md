# Technical Documentation

This document provides a technical overview of the POS Dashboard architecture, credit scoring system, and smart contract implementation.

## Architecture

- **Frontend**: Next.js 15 with React 18, Tailwind CSS, Chart.js for visualizations
- **Database**: Firebase Firestore for project data, authentication via GitHub
- **Data Sources**: GitHub API (issues, PRs, commits) stored as JSON, Thirdweb Nebula for blockchain data
- **Deployment**: Firebase Hosting (primary) at proofofship.web.app, Vercel (secondary)
- **Key Directories**: `src/components/` (reusable UI), `src/pages/` (routes), `src/contexts/` (providers), `data/` (GitHub data), `scripts/` (Firebase utilities)

## Credit Scoring Components

#### **GitHub Metrics (40% weight)**

- Commit consistency and frequency
- Code quality (PR reviews, issue resolution)
- Open source contribution history
- Repository maintenance and activity

#### **Social Protocol Reputation (30% weight)**

- **Farcaster**: Developer community engagement, technical discussions
- **Lens**: Professional network, project showcases, peer endorsements
- Cross-protocol identity verification and consistency

#### **On-Chain Activity (20% weight)**

- Smart contract deployment history
- Transaction patterns and behavior
- DeFi protocol interactions
- Multi-chain activity diversity

#### **Project Milestones (10% weight)**

- Hackathon progress tracking
- Feature completion rates
- Documentation quality
- Community engagement

## Smart Contract System: `BuilderCredit.sol`

The core of the protocol, evolving from a simple funding contract to a comprehensive credit and loan management system.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BuilderCredit is Ownable {
    // --- Enums and Structs ---

    enum LoanStatus { Active, Repaid, RolledOver, Defaulted }

    struct Project {
        uint256 projectId;
        address owner;
        string githubUrl;
        uint256 stakeAmount;
        bool isActive;
    }

    struct Loan {
        uint256 loanId;
        address developer;
        uint256 projectId;
        uint256 amount;
        uint256 issueDate;
        uint256 dueDate;
        LoanStatus status;
        string hackathonId; // To track which event the loan is tied to
    }

    // --- State Variables ---

    IERC20 public usdcToken;
    uint256 public registrationStakeAmount;
    address public milestoneOracle;

    mapping(address => uint256) public developerCreditScores;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Loan) public loans;
    uint256 private nextProjectId;
    uint256 private nextLoanId;

    // --- Events ---

    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string githubUrl);
    event LoanRequested(uint256 indexed loanId, address indexed developer, uint256 amount);
    event MilestoneVerified(uint256 indexed loanId, bytes32 milestoneId);
    event LoanRepaidByPartner(uint256 indexed loanId, address indexed partner);

    // --- Core Functions ---

    constructor(address _usdcAddress, uint256 _stakeAmount, address _oracle) {
        usdcToken = IERC20(_usdcAddress);
        registrationStakeAmount = _stakeAmount;
        milestoneOracle = _oracle;
    }

    /**
     * @notice Registers a new project, requiring a USDC stake.
     * @param _githubUrl The URL of the project's GitHub repository.
     */
    function registerProject(string memory _githubUrl) external {
        require(usdcToken.transferFrom(msg.sender, address(this), registrationStakeAmount), "Stake transfer failed");
        projects[nextProjectId] = Project({
            projectId: nextProjectId,
            owner: msg.sender,
            githubUrl: _githubUrl,
            stakeAmount: registrationStakeAmount,
            isActive: true
        });
        emit ProjectRegistered(nextProjectId, msg.sender, _githubUrl);
        nextProjectId++;
    }

    /**
     * @notice Allows a developer to request funding based on their credit score.
     * @param _amount The amount of USDC requested.
     * @param _projectId The ID of the project the loan is for.
     */
    function requestFunding(uint256 _amount, uint256 _projectId) external {
        // 1. Check credit score to determine eligibility (logic off-chain for now)
        // 2. Check if project is active and owned by the sender
        // 3. Transfer USDC from partner pool to developer
        // 4. Create and store the new Loan struct
    }

    /**
     * @notice Called by the oracle to verify a milestone has been met.
     * @param _loanId The ID of the loan associated with the milestone.
     * @param _milestoneId A unique identifier for the milestone.
     */
    function verifyMilestone(uint256 _loanId, bytes32 _milestoneId) external {
        require(msg.sender == milestoneOracle, "Not the oracle");
        // Logic to handle milestone verification and potential loan forgiveness
        emit MilestoneVerified(_loanId, _milestoneId);
    }

    /**
     * @notice Allows a hackathon partner to repay a loan on behalf of a developer.
     * @param _loanId The ID of the loan to repay.
     */
    function repayLoanForBuilder(uint256 _loanId) external {
        // 1. Requires partner to be registered/whitelisted (future feature)
        // 2. Partner transfers USDC to cover the loan
        // 3. Loan status is updated to Repaid
        emit LoanRepaidByPartner(_loanId, msg.sender);
    }

    // --- Admin and Oracle Functions ---

    function setMilestoneOracle(address _newOracle) external onlyOwner {
        milestoneOracle = _newOracle;
    }
}
```

## Milestone Verification Oracle

The `verifyMilestone` function is critical for the innovative repayment model. Its security and reliability are paramount.

- **Initial Implementation (Phase 3)**: The oracle will be a multi-signature wallet controlled by trusted parties (e.g., 2 of 3 signatures from hackathon organizers and project admins). This provides a secure, manual process for verifying that project milestones have been met.
- **Future Automation (Phase 5+)**: The long-term vision is to automate this process. This could involve an on-chain service that programmatically checks for specific conditions, such as:
  - A successful deployment of a contract to a mainnet address.
  - A certain number of commits to a linked GitHub repository.
  - A specific event being emitted from the project's smart contract.

## Multi-Chain Strategy

Achieving a seamless multi-chain experience requires a three-pronged approach:

1.  **Deterministic Contract Deployment**: The `BuilderCredit` smart contract will be deployed to multiple chains (e.g., Ethereum, Linea, Base, Polygon) at the exact same address. This is achievable using the `CREATE2` opcode, which allows for counterfactual contract deployment. This provides a single, predictable point of interaction for developers, regardless of the chain they are on.
2.  **Cross-Chain Data Aggregation**: The off-chain credit scoring engine will be responsible for querying data from multiple chains. It will use RPC providers to fetch a user's transaction history, contract deployments, and DeFi interactions across all supported networks, aggregating this data into a single, unified on-chain reputation score.
3.  **Cross-Chain Funding Distribution (LI.FI SDK)**: The integration with the LI.FI SDK (planned for Phase 4) is crucial. It will allow the protocol to abstract away the complexity of cross-chain transfers. For example, a hackathon partner could deposit USDC on Ethereum, and a developer could receive their funding on Polygon, with LI.FI handling the bridging in the background.

## Technical Integration Points

### **Farcaster Integration**

```javascript
// Farcaster reputation analysis
const farcasterScore = await analyzeFarcasterProfile({
  handle: developer.farcasterHandle,
  metrics: [
    "cast_engagement",
    "follower_quality",
    "dev_channel_activity",
    "technical_discussions",
    "peer_endorsements",
  ],
});
```

### **Lens Protocol Integration**

```javascript
// Lens professional network analysis
const lensScore = await analyzeLensProfile({
  profile: developer.lensProfile,
  metrics: [
    "professional_connections",
    "project_showcases",
    "skill_endorsements",
    "community_contributions",
    "content_quality",
  ],
});
```

### **Cross-Protocol Verification**

```javascript
// Verify identity consistency across platforms
const identityVerification = await verifyIdentity({
  wallet: developer.address,
  github: developer.githubUsername,
  farcaster: developer.farcasterHandle,
  lens: developer.lensProfile,
});
```

### API Endpoints

#### `/api/funding`

POST endpoint for funding operations:

- `createWallet`
- `getBalance`
- `processFunding`
- `getTransferStatus`
- `getFundingHistory`
