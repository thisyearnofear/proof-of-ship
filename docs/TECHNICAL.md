# Technical Documentation

This document provides a technical overview of the POS Dashboard architecture, credit scoring system, and smart contract implementation.

## Architecture

- **Frontend**: Next.js 13 with React 18, Tailwind CSS, Chart.js for visualizations
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

## Smart Contract System

```solidity
// Core funding contract with social reputation integration
contract BuilderCredit {
    struct Developer {
        address wallet;
        uint256 githubScore;
        uint256 farcasterScore;
        uint256 lensScore;
        uint256 onchainScore;
        uint256 totalCreditScore;
        uint256 eligibleAmount;
    }

    struct Loan {
        address developer;
        uint256 amount;
        uint256 issueDate;
        uint256 dueDate;
        bool milestonesMet;
        bool repaidByHackathon;
        bytes32[] requiredMilestones;
        mapping(bytes32 => bool) completedMilestones;
    }

    function requestFunding(
        bytes32 githubCommitHash,
        string memory farcasterHandle,
        string memory lensProfile,
        address[] memory deployedContracts
    ) external;

    function updateReputation(
        address developer,
        uint256 newGithubScore,
        uint256 newSocialScore,
        uint256 newOnchainScore
    ) external onlyOracle;

    function verifyMilestone(
        address developer,
        bytes32 milestoneId,
        bytes memory proof
    ) external onlyOracle;
}
```

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
