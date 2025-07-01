# AGENT.md - POS Dashboard Development Guide

## Commands

- **Dev**: `npm run dev` (Next.js development server on localhost:3000)
- **Build**: `npm run build` (production build)
- **Lint**: `npm run lint` (Next.js ESLint)
- **Data Load**: `npm run load` (loads all GitHub data) | `node data/load.js <repo-slug>` (specific repo)
- **Deploy**: `npm run deploy` (builds and deploys to Firebase Hosting)
- **Test**: No test framework configured - check with user before adding tests

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/POS-dashboard.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see TECHNICAL.md)
5. Run the development server: `npm run dev`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test your changes locally
4. Commit your changes with a descriptive commit message
5. Push your branch to your fork: `git push origin feature/your-feature-name`
6. Create a pull request to the main repository

## Code Style

- **Components**: Functional components with hooks, default exports, PascalCase files (StatCard.js)
- **Imports**: Next.js/React first, third-party, then local with `@/` alias (`@/components/common/cards`)
- **Styling**: Tailwind utility classes with template literals for conditional styles
- **Props**: Destructure in function parameters with JSDoc comments for complex components
- **Icons**: Heroicons for consistency (`@heroicons/react/24/outline`)
- **No comments**: Avoid code comments unless complex logic requires explanation
