# 🚀 Builder Credit Platform - Setup Guide

## 📋 Phase 1: Get API Keys & Accounts (30 minutes)

### 1. Circle Developer Account

1. Go to https://developers.circle.com/
2. Sign up for a developer account
3. Create a new project
4. Get your API keys:
   - `CIRCLE_API_KEY` (sandbox)
   - `CIRCLE_WALLET_SET_ID`
   - `CIRCLE_ENTITY_SECRET`

### 2. GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Create a new Personal Access Token (classic)
3. Select scopes: `public_repo`, `read:user`, `read:org`
4. Copy the token: `GITHUB_TOKEN`

### 3. LI.FI API Key

1. Go to https://docs.li.fi/
2. Contact support or check their Discord for API access
3. Get your API key: `NEXT_PUBLIC_LIFI_API_KEY`

### 4. Infura Account (for blockchain access)

1. Go to https://infura.io/
2. Create a new project
3. Get your project ID: `INFURA_API_KEY`

### 5. MetaMask Project ID (optional - for $2k bonus)

1. Go to https://cloud.metamask.io/
2. Create a new project
3. Get your project ID: `NEXT_PUBLIC_METAMASK_PROJECT_ID`

## 🔧 Phase 2: Environment Setup (15 minutes)

### 1. Create Environment Files

```bash
# Copy the example file
cp .env.example .env

# Copy for blockchain directory
cp .env.example blockchain/.env
```

### 2. Fill in your .env file:

```bash
# Blockchain Configuration
PRIVATE_KEY=your_wallet_private_key_here
INFURA_API_KEY=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
REPORT_GAS=true

# RPC URLs (use Infura or public RPCs)
ETHEREUM_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
BASE_SEPOLIA_RPC=https://sepolia.base.org
OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io
CELO_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org
LINEA_SEPOLIA_RPC=https://rpc.sepolia.linea.build

# Circle API (REQUIRED)
CIRCLE_API_KEY=your_circle_sandbox_api_key
CIRCLE_WALLET_SET_ID=your_wallet_set_id
CIRCLE_ENTITY_SECRET=your_entity_secret
CIRCLE_ENVIRONMENT=sandbox

# LI.FI API (REQUIRED)
NEXT_PUBLIC_LIFI_API_KEY=your_lifi_api_key

# GitHub API (REQUIRED)
GITHUB_TOKEN=your_github_personal_access_token

# MetaMask SDK (BONUS)
NEXT_PUBLIC_METAMASK_PROJECT_ID=your_metamask_project_id

# Firebase (keep your existing values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_existing_value
# ... other Firebase configs
```

## 🏗️ Phase 3: Deploy Smart Contracts (30 minutes)

### 1. Install Dependencies

```bash
cd blockchain
npm install
```

### 2. Test Local Deployment

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy locally
npx hardhat run scripts/deployTestnet.js --network localhost
```

### 3. Deploy to Testnets

```bash
# Deploy to individual networks
npx hardhat run scripts/deployTestnet.js --network sepolia
npx hardhat run scripts/deployTestnet.js --network baseSepolia
npx hardhat run scripts/deployTestnet.js --network arbitrumSepolia

# Or deploy to all networks at once
npm run deploy:all
```

### 4. Update Frontend Environment

After deployment, add the contract addresses to your `.env` file:

```bash
NEXT_PUBLIC_BUILDER_CREDIT_ADDRESS_SEPOLIA=0x...
NEXT_PUBLIC_BUILDER_CREDIT_ADDRESS_BASE_SEPOLIA=0x...
NEXT_PUBLIC_BUILDER_CREDIT_ADDRESS_ARBITRUM_SEPOLIA=0x...
# ... etc
```

## 💰 Phase 4: Get Testnet Tokens (15 minutes)

### 1. Get ETH for Gas Fees

- **Sepolia**: https://sepoliafaucet.com/
- **Base Sepolia**: https://faucet.quicknode.com/base/sepolia
- **Arbitrum Sepolia**: https://faucet.quicknode.com/arbitrum/sepolia
- **OP Sepolia**: https://faucet.quicknode.com/optimism/sepolia
- **Celo Alfajores**: https://faucet.celo.org/alfajores
- **Linea Sepolia**: https://faucet.goerli.linea.build/

### 2. Get Testnet USDC

You'll need to use Circle's faucet or bridge real USDC to testnets through their tools.

## 🖥️ Phase 5: Frontend Setup (15 minutes)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test the Application

1. Go to http://localhost:3000
2. Connect your MetaMask wallet
3. Switch to a testnet (Sepolia, Base Sepolia, etc.)
4. Test wallet connection
5. Test GitHub login
6. Test credit scoring
7. Test funding requests

## 🧪 Phase 6: Testing & Integration (30 minutes)

### 1. Test Circle API Integration

```bash
# Test Circle API endpoints
curl http://localhost:3000/api/circle/status
curl http://localhost:3000/api/circle/config
```

### 2. Test Smart Contract Integration

1. Connect wallet to testnet
2. Go to credit dashboard
3. Request funding
4. Check transaction on block explorer

### 3. Test Cross-Chain Functionality

1. Use the cross-chain transfer component
2. Transfer USDC between testnets
3. Monitor transfer status

## 🚨 Troubleshooting

### Common Issues:

**1. "Circle API key not configured"**

- Make sure `CIRCLE_API_KEY` is in your `.env` file
- Restart your dev server after adding environment variables

**2. "GitHub API rate limit exceeded"**

- Make sure `GITHUB_TOKEN` is configured
- GitHub API has rate limits, wait a few minutes

**3. "LI.FI SDK not configured"**

- Make sure `NEXT_PUBLIC_LIFI_API_KEY` is configured
- Check LI.FI documentation for API access

**4. Smart contract deployment fails**

- Make sure you have testnet ETH
- Check your `PRIVATE_KEY` is correct
- Verify RPC URLs are working

**5. MetaMask connection issues**

- Add testnet networks to MetaMask manually
- Make sure you're on the right network

## 📝 Phase 7: Prepare for Hackathon Submission

### 1. Document Your Progress

- Take screenshots of working features
- Record a demo video
- List all implemented features

### 2. Prepare Demo Script

1. Show wallet connection
2. Demonstrate GitHub credit scoring
3. Show USDC transfers
4. Demonstrate cross-chain functionality
5. Show smart contract interactions

### 3. Verify Hackathon Requirements

- ✅ MetaMask Card integration
- ✅ Circle Wallets ($2k bonus)
- ✅ LI.FI SDK ($2k bonus)
- ✅ USDC payments
- ✅ Real-world use cases

## 🎯 Success Criteria

After completing this setup, you should have:

- ✅ Real Circle API integration
- ✅ Deployed smart contracts on multiple testnets
- ✅ Working GitHub credit scoring
- ✅ Functional LI.FI cross-chain transfers
- ✅ USDC payment system
- ✅ MetaMask SDK integration

## 🔄 Next.js 14 Upgrade Guide

### Security Update Information

The platform has been upgraded from Next.js 13.4.12 to **14.2.35** to address critical React Server Components CVE vulnerabilities.

### Changes Made

- **Next.js**: `13.4.12` → `14.2.35` (security fix)
- **eslint-config-next**: `^13.4.12` → `^14.2.35` (compatibility)

### Upgrade Steps

```bash
# 1. Update dependencies
cd frontend
npm install

# 2. Test development mode
npm run dev

# 3. Test production build
npm run build

# 4. Run linting
npm run lint
```

### Testing Requirements

**Critical Paths to Test:**
- ✅ Authentication flows (MetaMask, Circle Wallet)
- ✅ GitHub integration and data fetching
- ✅ Project creation and editing
- ✅ Credit scoring calculations
- ✅ Cross-chain funding interfaces

### Potential Issues to Monitor

**Webpack Configuration:**
- Custom webpack config in `next.config.js`
- Async storage polyfill compatibility
- MetaMask SDK aliasing

**Static Export Mode:**
- `EXPORT_MODE=true` configuration
- Image optimization with `unoptimized: true`
- Trailing slash handling

### Rollback Plan

If issues are encountered:

```bash
# Revert the commit
git revert <commit-hash>

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# Test previous version
npm run dev
```

## 🎨 Portfolio Feature Setup

### Subdomain Configuration

The platform now supports **subdomain-based user portfolios**:

- **Format**: `username.yourdomain.com` → `/u/username`
- **Local testing**: `username.localhost:3000` → `/u/username`
- **Reserved subdomains**: www, app, api, admin (cannot be used)

### Testing Subdomain Routing

```bash
# Test locally with curl
curl -H "Host: testuser.localhost" http://localhost:3000

# Should return the portfolio page for "testuser"
```

### Portfolio API Endpoints

**Get User Portfolio:**
```bash
curl http://localhost:3000/api/portfolio/username
```

**Submit Feedback:**
```bash
curl -X POST http://localhost:3000/api/feedback/submit \
  -H "Content-Type: application/json" \
  -d '{"projectSlug":"test","message":"Great project!"}'
```

### New Pages to Test

1. **User Portfolio**: `/u/username`
2. **Feedback Form**: `/feedback`
3. **Project Pages**: `/projects/[ecosystem]/[slug]`
4. **Enhanced Editor**: `/projects/new`

### Ecosystem Configuration

Updated `ecosystems.js` with:
- Visual identity (icons, colors, gradients)
- Routing information
- Submission requirements
- Feature lists

### Navbar Updates

- **Branding**: "Developer Funding Platform" → "Onchain Project Portfolio"
- **My Portfolio**: Link to user's portfolio page (when authenticated)
- **Enhanced UI**: Better mobile responsiveness

### Project Editor Enhancements

- **Multi-ecosystem support**: Select ecosystem during creation
- **Categories**: DeFi, NFTs, Gaming, Social, Infrastructure, DAO
- **Team members**: Add multiple team members
- **Milestones**: Track project milestones
- **Funding options**: Looking for funding toggle
- **Hackathon tracking**: Basic integration

### Testing Checklist

**Portfolio Features:**
- [ ] Subdomain routing works locally
- [ ] Portfolio API returns correct data
- [ ] User portfolio page renders correctly
- [ ] Error handling for non-existent users
- [ ] Loading states work properly

**Project Features:**
- [ ] Project creation with new fields
- [ ] Project editing preserves data
- [ ] Ecosystem-specific project pages
- [ ] Multi-ecosystem project listing

**Feedback System:**
- [ ] Feedback submission works
- [ ] Validation prevents invalid submissions
- [ ] Feedback stored in Firestore

**UI/UX:**
- [ ] Navbar portfolio link appears when logged in
- [ ] Mobile responsiveness
- [ ] Error boundaries catch errors
- [ ] Loading states provide good UX

## 📞 Support

If you get stuck:

1. Check the error logs in browser console
2. Check server logs in terminal
3. Verify all environment variables are set
4. Test API endpoints individually
5. Check blockchain explorer for transaction status

Total estimated setup time: **2-3 hours**

Once this is complete, you'll have a working hackathon-ready application! 🎉
