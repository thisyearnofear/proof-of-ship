# MetaMask Card Hackathon - Builder Credit System

## 🎯 Project Overview

**Builder Credit System**: An AI-powered platform that provides instant liquidity to hackathon developers based on their creditworthiness, determined by GitHub activity, on-chain behavior, and social reputation across Farcaster and Lens protocols.

### Core Concept

- **Developers** showcase progress on our dashboard
- **AI agents** track and score their creditworthiness
- **Smart contracts** provide conditional funding
- **Hackathon sponsors** back successful loans for builders who meet milestones
- **Social protocols** bootstrap initial reputation scores

## 🏆 Hackathon Track Alignment

### **Primary Track: Smart Agents & Liquidity Automation ($6k)**

- AI agents for automated creditworthiness assessment
- Real-time liquidity management for builder funding pools
- Smart contract automation for conditional payments
- Cross-chain portfolio rebalancing for funding distribution

### **Secondary Track: Identity & OnChain Reputation ($6k)**

- Multi-protocol reputation scoring (GitHub + Farcaster + Lens + On-chain)
- Behavioral credit assessment based on development patterns
- Tiered access system based on reputation levels
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

### Phase 1: Core Infrastructure (PRIORITY)

1. **Smart Contract Deployment**

   - Deploy the `BuilderCredit.sol` contract to test networks
   - Set up proper contract verification
   - Implement comprehensive test coverage

2. **Fix API Integrations**

   - Replace mock implementations with real API calls
   - Implement proper error handling and validation
   - Set up proper environment variable management

3. **User Authentication Flow**
   - Implement secure wallet authentication
   - Set up proper session management
   - Connect wallet identity with GitHub, Farcaster, and Lens accounts

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

> "Introducing the Builder Credit System - the first AI-powered platform that provides instant USDC funding to hackathon developers based on their creditworthiness."

**Visual**: Show the three pillars with icons

- GitHub activity analysis
- Social reputation (Farcaster + Lens)
- On-chain behavior tracking

> "Our AI agents analyze developers across GitHub, Farcaster, and Lens protocols to create a comprehensive credit score. Higher scores unlock larger funding amounts - from $500 to $5,000 USDC."

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

> "What makes this revolutionary? First, we're the first to combine social proof with on-chain behavior for developer creditworthiness."

**Visual**: Show integration badges

> "We integrate MetaMask SDK for seamless wallet connectivity, Circle's USDC infrastructure for stable payments, and LI.FI for cross-chain distribution - hitting all three bonus categories."

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
