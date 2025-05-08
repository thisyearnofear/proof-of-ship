# POS Dashboard

A dashboard for tracking Proof of Ship projects across different seasons and chains.

## About

The dashboard consists of two main sections:

1. **Celo Proof of Ship Projects**: Tracks projects built during Celo's Proof of Ship program across three seasons. The dashboard visualizes commit activity, issues, and pull requests for each project, with filtering options by season.

2. **Papa Dashboard**: Tracks daily goals and progress across different blockchain projects, including Lens, Optimism, Polygon, Mantle, and Base chains.

## Data Loading

You can load GitHub data in two ways:

1. **General Data Load**: Load data for all repositories

```bash
npm run load
```

2. **Targeted Data Load**: Load data for a specific repository

```bash
node data/load.js <repository-slug>
```

Example: `node data/load.js esusu`

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your GitHub Personal Access Token:

```
GITHUB_TOKEN=your_token_here
```

4. Set up Firebase (for authentication and project editing):

   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with GitHub provider
   - Create a Firestore database
   - Get your Firebase config from Project Settings
   - Copy `.env.local.example` to `.env.local` and fill in your Firebase config
   - Deploy Firestore security rules from `firestore.rules`

5. Migrate existing project data to Firebase:

   - Run `node scripts/import-projects.js` to import projects from celoProjects.js
   - Run `node scripts/grant-project-ownership-by-github.js <github-username> <project-slug>` to grant a user edit access to a project based on their GitHub username

6. Run the development server: `npm run dev`
7. Open [http://localhost:3000](http://localhost:3000)

## Deployment

The dashboard is deployed to two different platforms:

### Firebase Hosting (Primary)

The main dashboard is deployed to Firebase Hosting at [https://proofofship.web.app](https://proofofship.web.app).

To deploy to Firebase Hosting:

1. Build the application: `npm run build`
2. Deploy to Firebase: `firebase deploy --only hosting`

Or use the combined script: `npm run deploy`

### Vercel (Secondary)

A secondary version is deployed to Vercel at [https://proof-of-ship.vercel.app/](https://proof-of-ship.vercel.app/).

To deploy to Vercel:

1. Set up the following environment variables in your Vercel project:

```
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# GitHub Token for data loading
GITHUB_TOKEN=your_github_token
```

2. Push your changes to the connected GitHub repository
3. Vercel will automatically deploy the changes

## Roadmap

- [ ] Add more visualization options
- [ ] Implement project search and filtering
- [ ] Add more detailed project analytics
- [ ] Improve mobile responsiveness
- [x] Add authentication for project owners
- [x] Implement project editing for owners
- [ ] Enhance contract data visualization and analytics

## Contract Data Enhancement Plan

We're planning to improve the UI/UX for contract data visualization in the dashboard, particularly for projects that have few GitHub activities but significant on-chain presence. This will provide a more comprehensive view of project activity and impact.

### Integration Options

We've researched two powerful tools for enhancing our contract data visualization:

#### 1. Thirdweb Nebula

[Thirdweb Nebula](https://portal.thirdweb.com/nebula/api-reference) provides a conversational interface to interact with blockchain data and services. Key features we can leverage:

- **Token Price Data**: Fetch current and historical price data for tokens
- **Transaction History**: Get detailed transaction history for contracts
- **NFT Data**: Retrieve NFT ownership and collection information
- **Multi-chain Support**: Query data across multiple blockchain networks

Implementation approach:

- Create a Nebula API client in our application
- Develop UI components to display token price charts, transaction volume, and other metrics
- Implement caching to minimize API calls

#### 2. Alchemy MCP Server

[Alchemy MCP Server](https://github.com/alchemyplatform/alchemy-mcp-server) is a Model Context Protocol server that enables AI agents to interact with Alchemy's blockchain APIs. Key features:

- **Token Price Methods**: Get current and historical price data
- **Multichain Token Methods**: Query token balances across networks
- **Transaction History**: Retrieve detailed transaction data
- **NFT Methods**: Get NFT ownership and contract data

Implementation approach:

- Set up the MCP server as a backend service
- Create API endpoints to proxy requests to the Alchemy MCP server
- Develop UI components to visualize the data

### Implementation Plan

1. **Phase 1: Enhanced Basic Contract Data**

   - Expand current contract data display to include:
     - Transaction volume over time
     - Token transfers (for ERC20 tokens)
     - Contract interaction metrics
   - Improve the UI to make contract data more prominent when GitHub activity is low

2. **Phase 2: Advanced Analytics Integration**

   - Integrate with either Thirdweb Nebula or Alchemy MCP Server
   - Add historical price charts for tokens
   - Display transaction heat maps and activity patterns
   - Show token holder distribution and changes

3. **Phase 3: Interactive Dashboards**
   - Create dedicated contract analytics pages
   - Implement interactive filters and time-range selectors
   - Add comparison views between different contracts
   - Develop custom visualizations for different contract types (ERC20, ERC721, etc.)

### Example: StableStation Contract Enhancement

For the StableStation project (contract: 0xa27D6E9091778896FBf34bC36A3A2ef22d06F804), we'll showcase:

- CUSD swap volume and transaction count
- User growth metrics
- Token price impact and liquidity data
- Interactive transaction history

This will provide a much richer view of the project's impact and usage, complementing the GitHub activity data.

## For Project Owners

If you're a project owner, you can now edit your project details:

1. **Sign in with GitHub**

   - Click "Sign in" in the top-right corner
   - Authenticate with your GitHub account

2. **Edit Your Project**

   - Once signed in, navigate to the dashboard
   - Find your project card
   - Click the "Edit" button on your project card
   - Update your project details (contracts, social links, founders, etc.)
   - Click "Save Changes"

3. **Request Access**
   - If you don't see an "Edit" button on your project, you may need to request access
   - Contact the administrator to grant you edit permissions for your project
   - The administrator will use your GitHub username to grant you access to your project

Note: Only existing projects can be edited by their owners. New projects can only be added by administrators.

## Projects

### Season 1 Projects

- 3WB (3-Wheeler Bike Club)
- AkiliAI
- NYFA
- Jazmeen

### Season 2 Projects

- Sovereign Seas
- Mind
- Canvass
- Subpay

### Season 3 Projects

- StableStation
- Esusu

### Papa Projects

- Famile (Lens)
- Amacast (Optimism)
- Imperfect (Polygon)
- MegaVibe (Mantle)
- CouponDJ (Base)

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Data Visualization**: Chart.js with react-chartjs-2
- **Date Handling**: date-fns
- **Icons**: Heroicons
- **Authentication**: Firebase Authentication with GitHub provider
- **Database**: Firebase Firestore
- **Blockchain Integration**: ethers.js

## Data Source

The dashboard uses GitHub API data stored in JSON format in the `data/github-data` directory:

- `issues.json`: Repository issues data
- `prs.json`: Pull request data
- `releases.json`: Release information
- `meta.json`: Repository metadata
- `commits.json`: Weekly commit data

## Project Structure

- `src/pages`: Application routes and page components
- `src/components`: Reusable UI components
- `src/contexts`: Context providers for authentication and data management
- `src/lib`: Utility functions and Firebase configuration
- `src/constants`: Constant values and project data
- `scripts`: Scripts for data management and Firebase operations
- `data`: GitHub data loading scripts and storage
- `public`: Static assets
- `out`: Static export output directory (for Firebase hosting)
- `.next`: Next.js build output directory
- `firestore.rules`: Firestore security rules
- `firebase.json`: Firebase configuration
- `next.config.js`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration

## Features

### Shippers Dashboard

- View project metrics for Celo Proof Of Ship projects
- Compare commit activity across projects
- Filter by metrics (commits, issues, PRs)
- View weekly activity trends

### Papa Dashboard

- Track progress toward personal goal of 100 quality commits per day
- Monitor commit activity across 5 personal multi-chain projects:
  - Famile.xyz (Lens)
  - Amacast (Optimism)
  - Imperfect Form (Polygon)
  - Megavibe (Mantle)
  - CouponDJ (Base)
- View daily commit statistics with progress bar
- Filter by time range (7 days, 30 days, all time)
- Compare projects by chain

## Roadmap for Multi-Repo Dashboard

1. **Define your repos**
   - Create `repos.json` in the project root listing each project with `slug`, `owner`, `repo`, and `season`.
2. **Fetch all data**
   - Update `data/load.js` to read `repos.json`, loop over each entry, fetch GitHub issues, PRs, releases (with pagination), and save to `data/github-data/{slug}-issues.json`, `*-prs.json`, `*-releases.json`.
3. **Context provider**
   - Modify `src/providers/Github/Github.js` to import every `
