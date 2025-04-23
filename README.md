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

4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Roadmap

- [ ] Add more visualization options
- [ ] Implement project search and filtering
- [ ] Add more detailed project analytics
- [ ] Improve mobile responsiveness

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
- `src/providers`: Context providers for data management
- `src/styles`: Global styles and Tailwind configuration

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
