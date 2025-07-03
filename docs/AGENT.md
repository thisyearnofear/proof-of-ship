# Developer Guide

## Commands

- **Dev**: `npm run dev` (Next.js development server on localhost:3000)
- **Build**: `npm run build` (production build)
- **Lint**: `npm run lint` (Next.js ESLint)
- **Data Load**: `npm run load` (loads all GitHub data) | `node data/load.js <repo-slug>` (specific repo)
- **Deploy**: `npm run deploy` (builds and deploys to Firebase Hosting)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/proof-of-ship.git`
3. Install dependencies: `npm install`
4. Set up environment variables:
   ```
   # Create a .env.local file with:
   GITHUB_TOKEN=your_github_token
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   NEXT_PUBLIC_CIRCLE_CLIENT_KEY=your_circle_client_key
   CIRCLE_API_KEY=your_circle_api_key
   CIRCLE_ENVIRONMENT=sandbox
   CIRCLE_WALLET_SET_ID=your_circle_wallet_set_id
   CIRCLE_ENTITY_SECRET=your_entity_secret
   CIRCLE_PLATFORM_WALLET_ID=your_circle_platform_wallet_id
   ```
5. Run the development server: `npm run dev`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes locally
4. Commit your changes with a descriptive commit message
5. Push your branch to your fork: `git push origin feature/your-feature-name`
6. Create a pull request to the main repository

## Project Structure

### Directory Organization

```
/
├── contracts/            # Smart contract source files
│   ├── interfaces/       # Contract interfaces
│   ├── libraries/        # Shared contract libraries
│   └── mocks/            # Mock contracts for testing
├── data/                 # GitHub data cache and loading scripts
├── docs/                 # Project documentation
├── public/               # Static assets
├── scripts/              # Utility scripts for deployment and management
├── test/                 # Test files for smart contracts and frontend
└── src/
    ├── components/       # Reusable UI components
    │   ├── common/       # Shared UI elements
    │   ├── dashboard/    # Dashboard-specific components
    │   ├── forms/        # Form components
    │   └── layout/       # Layout components
    ├── config/           # Environment and configuration
    ├── constants/        # Application constants
    ├── contexts/         # React context providers
    ├── hooks/            # Custom React hooks
    ├── lib/              # Utility functions and service integrations
    ├── middleware/       # Next.js middleware
    ├── pages/            # Next.js pages and API routes
    │   └── api/          # API endpoints
    ├── providers/        # Provider components
    ├── schemas/          # Data validation schemas
    ├── services/         # Business logic services
    ├── styles/           # Global styles
    └── utils/            # Utility functions
```

### Key Architecture Components

- **Smart Contracts**: Solidity contracts deployed on Ethereum (and potentially other chains)
- **Frontend Application**: Next.js web application for interacting with the contracts
- **API Integration**: Integration with Circle for programmable wallets and Li.Fi for cross-chain transfers

## Recommended Testing Strategy

> NOTE: Currently, no test framework is configured. This is a critical gap that needs to be addressed.

For a project of this complexity, we recommend implementing the following testing strategy:

1. **Unit Tests**:

   - Use Jest for testing utility functions and React components
   - Add tests for critical business logic, especially credit scoring and payment logic

2. **Integration Tests**:

   - Test component integrations using React Testing Library
   - Test API integrations with mock server responses

3. **End-to-End Tests**:

   - Use Cypress for complete user flow testing
   - Focus on critical paths: wallet connection, funding requests, and project submission

4. **Contract Tests**:
   - Use Hardhat for smart contract testing
   - Include unit tests for each contract function
   - Add integration tests for contract interactions

## Code Style

- **Components**: Functional components with hooks, default exports, PascalCase files (StatCard.js)
- **Imports**: Next.js/React first, third-party, then local with `@/` alias (`@/components/common/cards`)
- **Styling**: Tailwind utility classes with template literals for conditional styles
- **Props**: Destructure in function parameters with JSDoc comments for complex components
- **Icons**: Heroicons for consistency (`@heroicons/react/24/outline`)
- **No comments**: Avoid code comments unless complex logic requires explanation

## Deployment

The dashboard is deployed to two different platforms:

### Firebase Hosting (Primary)

```bash
npm run deploy
```

Deploys to: [https://proofofship.web.app](https://proofofship.web.app)

### Vercel (Secondary)

Automatic deployment occurs when changes are pushed to the main branch.
Deploys to: [https://proof-of-ship.vercel.app/](https://proof-of-ship.vercel.app/)

## Contributing Guidelines

When contributing to this project, please follow these guidelines:

1. **Smart Contracts**: Place all contracts in the `/contracts` directory, with interfaces in `/contracts/interfaces`
2. **Tests**: Add corresponding test files for new functionality in the `/test` directory
3. **Documentation**: Update relevant documentation in `/docs` when making significant changes
4. **Frontend Components**: Organize components by feature in the appropriate subdirectory of `/src/components`
