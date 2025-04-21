# POS Dashboard

A dashboard for tracking Proof of Ship projects across different seasons and chains.

## Features

### Celo Proof of Ship Projects

- Track progress of Celo-based projects across multiple seasons
- View commit activity, issues, and pull requests
- Filter projects by season (1, 2, and 3)
- Compare metrics across different projects
- Visualize data with interactive charts

### Papa Dashboard

- Track progress toward personal goal of 100 quality commits per day
- Monitor 5 personal multi-chain projects
- View daily commit statistics
- Filter by time range
- Compare projects by chain

## Data Loading

The dashboard supports two types of data loading:

### General Data Load

To load data for all repositories:

```bash
npm run load
```

### Targeted Data Load

To load data for a specific repository:

```bash
node data/load.js <repository-slug>
```

For example, to load data for the esusu repository:

```bash
node data/load.js esusu
```

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

## Development

### Prerequisites

- Node.js
- npm
- GitHub Personal Access Token (PAT)

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your GitHub PAT:
   ```
   GITHUB_TOKEN=your_pat_here
   ```
4. Run the development server: `npm run dev`

## Roadmap

### Multi-Repo Dashboard

- [x] Support for multiple repositories
- [x] Season-based filtering
- [x] Chain-based filtering for Papa projects
- [ ] Advanced filtering options
- [ ] Custom date ranges
- [ ] Export functionality

### Redesign v2 Feature Roadmap

- [ ] Enhanced visualization options
- [ ] Project health metrics
- [ ] Contributor activity tracking
- [ ] Automated daily updates
- [ ] Custom alerts and notifications

## Getting Started

---

## 🚀 Production Deployment (Vercel)

This project is designed for easy deployment to [Vercel](https://vercel.com/):

1. **Deploy to Vercel:**

   - Connect your GitHub repo to Vercel and deploy as a Next.js app.
   - All static data is served from `/public/data/github-data/`.

2. **Manual Data Updates:**

   - To update dashboard data, run:
     ```bash
     npm run load
     ```
   - This executes `node data/load.js`, fetching fresh data from GitHub and writing new JSON files to `/public/data/github-data/`.
   - Commit and push the updated JSON files to your repository, then redeploy to Vercel.

3. **Data Freshness:**
   - The dashboard shows the last updated timestamp at the bottom of the chart page.
   - Data is not live; it updates whenever you run the loader script and redeploy.

---

## 🔄 Planned: Automated Data Updates with GitHub Actions

In the future, you can automate data refreshes by setting up a GitHub Actions workflow to:

- Run `npm run load` on a schedule (e.g., daily).
- Commit and push the updated data files.
- Trigger a Vercel redeploy (using a deploy hook or by pushing to main).

For now, all updates are manual to ensure you stay within GitHub API rate limits and have full control over data refreshes.

---

### Prerequisites

- Node.js 22.x or higher
- npm
- GitHub Personal Access Token (PAT) with repo access; create a `.env` file in project root containing:
  ```bash
  GITHUB_TOKEN=your_token_here
  ```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/thisyearnofear/POS-dashboard.git
cd POS-dashboard
```

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

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
