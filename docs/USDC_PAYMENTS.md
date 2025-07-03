# USDC Payment Service Documentation

## Overview

The USDC Payment Service provides a comprehensive solution for handling USDC payments, developer funding, and wallet management using Circle's APIs. It supports both sandbox and production environments with graceful fallbacks for development.

## Features

- **Developer Funding**: Credit score-based funding calculations and transfers
- **Wallet Management**: Create and manage Circle wallets
- **Transfer Operations**: Send USDC to blockchain addresses
- **Multi-chain Support**: Ethereum and Polygon networks
- **Mock Mode**: Development-friendly fallbacks when APIs aren't configured
- **Comprehensive Validation**: Address validation and error handling

## Configuration

### Environment Variables

```bash
# Required for production functionality
CIRCLE_API_KEY=your_circle_api_key_here
CIRCLE_PLATFORM_WALLET_ID=your_platform_wallet_id

# Optional - defaults to 'sandbox'
CIRCLE_ENVIRONMENT=sandbox|production

# Frontend configuration
NEXT_PUBLIC_CIRCLE_CLIENT_KEY=your_client_key_here
```

### Supported Networks

**Sandbox Environment:**
- Ethereum Sepolia (ETH-SEPOLIA)
- Polygon Mumbai (MATIC-MUMBAI)

**Production Environment:**
- Ethereum Mainnet (ETH)
- Polygon Mainnet (MATIC)

## API Usage

### Core Service Methods

#### `processDeveloperFunding(developerAddress, creditScore, creditData)`

Processes funding for developers based on their credit score.

```javascript
import { usdcPaymentService } from '../lib/usdcPayments';

const result = await usdcPaymentService.processDeveloperFunding(
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  720,
  { githubUsername: 'developer123' }
);

console.log(result);
// {
//   success: true,
//   amount: 2500,
//   transfer: { id: '...', status: 'complete' },
//   mockFunding: false
// }
```

#### `calculateFundingAmount(creditScore)`

Calculates funding amount based on credit score.

```javascript
const amount = usdcPaymentService.calculateFundingAmount(720);
console.log(amount); // 2500
```

#### `createWallet(userId)`

Creates a new Circle wallet for a user.

```javascript
const wallet = await usdcPaymentService.createWallet('user123');
console.log(wallet);
// {
//   id: 'wallet-id',
//   address: '0x...',
//   status: 'active'
// }
```

#### `transferUSDC(sourceWalletId, destinationAddress, amount)`

Transfers USDC between wallets.

```javascript
const transfer = await usdcPaymentService.transferUSDC(
  'source-wallet-id',
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  '100'
);
```

### Utility Methods

#### `getFundingEligibility(creditScore)`

Gets comprehensive funding eligibility information.

```javascript
const eligibility = usdcPaymentService.getFundingEligibility(720);
console.log(eligibility);
// {
//   eligible: true,
//   amount: 2500,
//   tier: { tier: 'Good', color: 'blue' },
//   requirements: [],
//   benefits: ['Up to $2500 in USDC funding', ...]
// }
```

#### `validateWalletAddress(address)`

Validates Ethereum wallet addresses.

```javascript
const isValid = usdcPaymentService.validateWalletAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
console.log(isValid); // true
```

## API Endpoints

### POST `/api/funding`

Handles all funding-related operations.

#### Actions

**`processFunding`**
```json
{
  "action": "processFunding",
  "developerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "creditScore": 720,
  "creditData": {}
}
```

**`calculateFunding`**
```json
{
  "action": "calculateFunding",
  "creditScore": 720
}
```

**`createWallet`**
```json
{
  "action": "createWallet",
  "userId": "user123"
}
```

**`getBalance`**
```json
{
  "action": "getBalance",
  "walletId": "wallet-id"
}
```

**`transferUSDC`**
```json
{
  "action": "transferUSDC",
  "sourceWalletId": "source-wallet-id",
  "destinationAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "amount": 100,
  "reason": "Developer funding"
}
```

**`getFundingHistory`**
```json
{
  "action": "getFundingHistory",
  "developerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

**`checkConfiguration`**
```json
{
  "action": "checkConfiguration"
}
```

## Frontend Integration

### React Context Usage

```javascript
import { useCircleWallet } from '../contexts/CircleWalletContext';

function FundingComponent() {
  const { 
    requestFunding, 
    calculateFundingAmount, 
    getFundingHistory,
    loading 
  } = useCircleWallet();

  const handleRequestFunding = async () => {
    try {
      const result = await requestFunding(walletAddress, creditScore);
      console.log('Funding approved:', result);
    } catch (error) {
      console.error('Funding failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleRequestFunding} disabled={loading}>
        {loading ? 'Processing...' : 'Request Funding'}
      </button>
    </div>
  );
}
```

### Helper Functions

```javascript
import { formatUSDC, getFundingTier } from '../lib/usdcPayments';

// Format currency
const formatted = formatUSDC(2500); // "$2,500.00"

// Get funding tier
const tier = getFundingTier(720); // { tier: 'Good', color: 'blue' }
```

## Credit Score Funding Matrix

| Credit Score Range | Funding Amount | Tier | Color |
|-------------------|----------------|------|-------|
| 800-850 | $5,000 | Excellent | Green |
| 700-799 | $2,500-$4,500 | Good | Blue |
| 600-699 | $1,500-$2,500 | Fair | Yellow |
| 500-599 | $750-$1,500 | Poor | Orange |
| 400-499 | $500-$750 | Very Poor | Red |
| Below 400 | $0 | Ineligible | Red |

## Error Handling

The service includes comprehensive error handling:

- **API Key Missing**: Falls back to mock mode for development
- **Network Errors**: Provides meaningful error messages
- **Invalid Addresses**: Validates wallet addresses before operations
- **Low Credit Scores**: Clear eligibility requirements
- **Transfer Failures**: Fallback to mock transfers for demo purposes

## Testing

Run the test suite:

```bash
npm test src/lib/__tests__/usdcPayments.test.js
```

The tests cover:
- Funding calculations
- Address validation
- Mock mode functionality
- Error scenarios
- Helper functions

## Security Considerations

- API keys are validated before operations
- Wallet addresses are validated using regex patterns
- All transfers include idempotency keys
- Environment-specific chain selection
- Comprehensive error logging

## Development vs Production

**Development Mode:**
- Uses mock transfers when API keys aren't configured
- Provides detailed console logging
- Falls back gracefully for demo purposes

**Production Mode:**
- Requires valid Circle API keys
- Uses real blockchain networks
- Implements proper error handling and retries

## Support

For issues or questions:
1. Check the test files for usage examples
2. Review error logs for specific issues
3. Ensure environment variables are properly configured
4. Verify wallet addresses are valid Ethereum addresses
