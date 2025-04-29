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
