# Bruno GitHub Dashboard

A dashboard application built with Next.js to visualize and analyze GitHub repository data for [Bruno](https://github.com/usebruno/bruno).

## Getting Started

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
git clone https://github.com/yourusername/bruno-github-dashboard.git
cd bruno-github-dashboard
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

## Project Structure

- `src/pages`: Application routes and page components
- `src/components`: Reusable UI components
- `src/providers`: Context providers for data management
- `src/styles`: Global styles and Tailwind configuration

## Roadmap for Multi-Repo Dashboard

1. **Define your repos**  
   - Create `repos.json` in the project root listing each project with `slug`, `owner`, `repo`, and `season`.
2. **Fetch all data**  
   - Update `data/load.js` to read `repos.json`, loop over each entry, fetch GitHub issues, PRs, releases (with pagination), and save to `data/github-data/{slug}-issues.json`, `*-prs.json`, `*-releases.json`.
3. **Context provider**  
   - Modify `src/providers/Github/Github.js` to import every `{slug}-*.json`, build a map `{ [slug]: { issues, prs, releases, meta } }`, and expose it via context.
4. **UI & Routing**  
   - Add a project selector (dropdown or tabs) to switch active `slug`.  
   - Refactor `src/pages/dashboard.js` into `src/pages/dashboard/[slug].js` using Next.js dynamic routing (`getStaticPaths`/`getStaticProps`).  
   - Group repos by `season` in the Navbar for Season 1 vs Season 2.
5. **Comparison mode (optional)**  
   - Enable multi-select of `slug` to display side‑by‑side metrics across projects.
6. **Run & Verify**  
   ```bash
   # ensure repos.json exists and .env has GITHUB_TOKEN
   node data/load.js
   npm run dev
   ```
7. **Next steps**  
   - Refine styles and maintain the Tailwind + Heroicons design ethos, add cross‑repo comparisons, and polish UX.

## Redesign v2: Feature Roadmap

1. **Expanded Metrics Panel**  
   - Stars, forks, watchers  
   - Weekly commits (commit_activity API)  
   - PR merge vs open ratio  
   - Average issue resolution time

2. **Activity Timeline**  
   - Multi‑series line chart (stars, forks, commits over time)  
   - Zoom & brush for date ranges

3. **Contributor Insights**  
   - Leaderboard of top committers/reviewers/closers  
   - Pie/bar chart of contributions per user  
   - Daily activity heatmap calendar

4. **Prediction Market (future)**  
   - Define milestones (e.g. 100 stars, 50 contributors)  
   - Betting UI with odds & implied probabilities  
   - Rewards (points, badges) for correct predictions

5. **UI Layout & Tabs**  
   1. Overview (hero) page: key metrics chart + filters  
   2. Dashboard: per‑repo stats  
   3. Insights: deep‑dive issues/pulls/releases  
   4. Predictions: market interface

6. **Data Loader Enhancements**  
   - Fetch `/repos/:owner/:repo` (stars, forks, watchers)  
   - Fetch `/stats/commit_activity` & `/stats/contributors`  
   - Save new files `{slug}-repo.json`, `{slug}-commits.json`, `{slug}-contributors.json`

7. **Next Steps**  
   - Scaffold Overview page  
   - Update Navbar tabs  
   - Build StatsCards, Insights, Predictions UI

## License
MIT