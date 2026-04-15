# MetaMask Card Hackathon - Builder Credit System

## 🎯 Project Overview

**Predictive Credit System**: A backer-funded, prize-collateralized platform that provides instant liquidity to hackathon developers. We use a "Predictive Credit" loop where backers bet on builders hitting milestones and winning prizes, which in turn determines the builder's credit limit.

### Core Concept (IMPLEMENTED)

- **Builders** request upfront credit for hackathon projects based on their reputation and market confidence.
- **Backers** stake capital on builders they believe will ship and win.
- **Market Confidence** score is dynamically generated based on backer activity and milestone progress.
- **Prize Collateralization** allows builders to borrow against future winnings, with limits set by market confidence.
- **Milestone Completion** validates bets, releases funds, and increases credit limits.

## 🏆 Hackathon Track Alignment

### **Primary Track: Smart Agents & Liquidity Automation ($6k)**

- Market agents for automated market confidence assessment
- Predictive liquidity management for builder funding pools
- Smart contract automation for conditional backer payouts
- Cross-chain portfolio rebalancing for funding distribution

### **Secondary Track: Identity & OnChain Reputation ($6k)**

- Multi-protocol reputation scoring (GitHub + Farcaster + Lens + On-chain)
- Market-based reputation assessment through backer bets
- Tiered access system based on market confidence levels
- Privacy-preserving reputation aggregation

### **Bonus Opportunities ($6k total)**

- **MetaMask SDK integration** ($2k) - Wallet connection and card integration
- **Circle Wallets** ($2k) - USDC treasury management for funding pools
- **LI.FI SDK** ($2k) - Cross-chain funding distribution

**Total Potential Prize**: $18,000

## 💳 MetaMask Card Integration

### Current Implementation Status

Our current implementation includes several integrations with MetaMask and Circle, but needs significant improvements:

1. **MetaMask SDK Integration**:

   - Basic wallet connection using MetaMask SDK is implemented
   - USDC token support is hardcoded with incorrect contract addresses
   - Network detection and switching functionality is incomplete

2. **Circle API Integration**:

   - Current implementation uses mock Circle SDK instead of real integration
   - Funding transfers are simulated rather than executed
   - API keys and environment variables are not properly validated

3. **LI.FI Integration**:
   - The cross-chain functionality has non-functional implementations
   - The `executeTransfer` method is broken and requires fixing
   - No proper error handling or transaction status tracking

### Required Improvements

To meet hackathon requirements, the following improvements are necessary:

1. **MetaMask SDK Integration**:

   - Implement proper network detection and switching
   - Add real-time balance updates
   - Support EIP-1559 transactions
   - Implement proper error handling for rejected transactions

2. **Circle API Integration**:

   - Implement actual Circle API SDK rather than mocks
   - Add proper error handling and retry logic
   - Implement webhook handlers for Circle events
   - Set up proper validation for API keys and environment variables

3. **LI.FI SDK Integration**:
   - Fix the broken `executeTransfer` method with proper execution logic
   - Implement proper error handling and transaction status tracking
   - Add real-time transfer status updates

## 🔥 Feature Implementation Roadmap

### Phase 1: Core Predictive Loop (IMPLEMENTED)

1. **Backer Betting Mechanism**
   - COMPLETED: Implemented multiplier betting (1.5x, 2x, 3x) for backers.
   - COMPLETED: Market confidence calculation based on total backing.

2. **Prize Collateralization**
   - COMPLETED: Builders can pledge expected prizes.
   - COMPLETED: Automated prize distribution loop to repay backers + interest.

3. **Dashboard Updates**
   - COMPLETED: Real-time market confidence visualization and boosted credit limits.
   - COMPLETED: Backer activity tracking for builders.

### Phase 2: Credit Scoring System

1. **On-Chain Reputation Mechanism**

   - Implement proper on-chain reputation tracking
   - Create standardized metrics for developer contributions
   - Develop verification system for contributions

2. **Multi-Chain Support**

   - Implement cross-chain messaging for reputation
   - Create standardized reputation message format
   - Support multiple chains for funding and reputation

3. **Decentralized Milestone Verification**
   - Replace centralized milestone verification with DAO voting
   - Implement multisig approach for milestone approval
   - Create challenge period for verification disputes

### Phase 3: User Experience and Demo

1. **Dashboard UI Improvements**

   - Implement real-time transaction status updates
   - Create intuitive funding request flow
   - Develop clear credit score visualization

2. **Demo Preparation**
   - Create comprehensive demo script
   - Prepare test accounts and environments
   - Document all features and integrations for judges

## 🎥 Demo Script

### 🎬 **Full Demo Script (3 minutes)**

#### **[0:00-0:30] Problem Statement & Hook**

**Visual**: Split screen showing frustrated developer vs. hackathon sponsors

**Narration**:

> "Meet Sarah, a talented blockchain developer. She has amazing ideas for the MetaMask Card Hackathon, but lacks the upfront capital for development tools, hosting, and resources. Meanwhile, hackathon sponsors want to fund builders who will actually deliver quality projects."

**Visual**: Show traditional funding process - slow, manual, risky

> "Traditional funding is slow, manual, and risky. What if we could provide instant liquidity based on a developer's proven track record?"

#### **[0:30-1:00] Solution Overview**

**Visual**: Animated flow diagram showing the system

**Narration**:

> "Introducing the Predictive Credit System - the first backer-funded, prize-collateralized platform that provides instant USDC liquidity to hackathon developers."

**Visual**: Show the three pillars with icons

- Onchain Reputation
- Backer Betting Markets
- Prize Collateralization

> "Our platform allows backers to bet on builders they believe in. High market confidence unlocks larger prize-collateralized credit limits - from $500 to $5,000 USDC."

#### **[1:00-2:00] Live Demo**

**Visual**: Screen recording of actual application

**Step 1: Connect & Analyze (15 seconds)**

> "Let's see it in action. Sarah connects her MetaMask wallet and links her social profiles."

_Show wallet connection, GitHub OAuth, social profile linking_

**Step 2: Credit Scoring (15 seconds)**

> "Our AI instantly analyzes her data - 847 GitHub commits, active Farcaster presence, and solid on-chain history. Credit score: 720."

_Show real-time credit dashboard with breakdown_

**Step 3: Cross-Chain Funding (15 seconds)**

> "Based on her score, Sarah qualifies for $3,200 USDC. She selects Ethereum and Linea for distribution."

_Show chain selection and LI.FI integration_

**Step 4: Instant Transfer (15 seconds)**

> "Using LI.FI's cross-chain infrastructure, funds are distributed instantly across both chains. Sarah can now focus on building instead of fundraising."

_Show successful transfers and balance updates_

#### **[2:00-2:30] Innovation Highlights**

**Visual**: Feature showcase with technical callouts

**Narration**:

> "What makes this revolutionary? We're moving from static credit scoring to dynamic predictive markets. We're the first to use hackathon prizes as collateral for upfront development credit."

**Visual**: Show integration badges

> "We integrate MetaMask SDK for seamless wallet connectivity, Circle's USDC infrastructure for stable payments, and LI.FI for cross-chain distribution - all secured by our predictive credit loop."

**Visual**: Smart contract interaction

> "Smart contracts automate milestone tracking and conditional repayments, creating a trustless funding ecosystem."

#### **[2:30-3:00] Impact & Call to Action**

**Visual**: Success metrics and future vision

**Narration**:

> "Imagine a world where your GitHub contributions, social reputation, and on-chain activity unlock instant access to development capital. No more waiting for grants or pitching to VCs."

**Visual**: Community of funded developers building

> "We're not just funding individual developers - we're building the infrastructure for the next generation of decentralized innovation."

**Visual**: Logo animation with hackathon tracks

> "Builder Credit System - where reputation meets liquidity. Join us in revolutionizing developer funding for the decentralized web."

### 🎯 **Key Demo Points to Emphasize**

1. **Real-time credit scoring** - Show actual GitHub/social data analysis
2. **Cross-chain USDC distribution** - Demonstrate LI.FI integration
3. **MetaMask Card integration** - Highlight wallet connectivity
4. **Smart contract automation** - Show milestone tracking
5. **Multi-protocol reputation** - GitHub + Farcaster + Lens

### 📊 **Technical Integrations to Showcase**

- ✅ **MetaMask SDK** - Wallet connection and card integration
- ✅ **Circle USDC** - Stable payment infrastructure
- ✅ **LI.FI SDK** - Cross-chain distribution
- ✅ **Smart Contracts** - Automated funding logic
- ✅ **AI Credit Scoring** - Multi-protocol analysis

### 📝 **Submission Checklist**

- [ ] Demo video (3 minutes max)
- [ ] Live hosted demo at proofofship.web.app/credit
- [ ] README with project details
- [ ] Smart contracts deployed to testnet
- [ ] All required integrations functional
- [ ] GitHub repository public and documented
