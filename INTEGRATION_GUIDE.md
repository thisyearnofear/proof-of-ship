# Phase 1 Integration Guide

Quick reference for integrating TractionCard and DeveloperCredibilityCard into existing pages.

## Simple Integration (5 minutes)

### On Project Detail Page

```javascript
// /src/pages/projects/[slug].js

import ProjectShowcase from '@/components/showcase/ProjectShowcase';
import { getProjectBySlug } from '@/lib/db'; // Your existing DB function

export default function ProjectPage({ project }) {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <ProjectShowcase project={project} />
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const project = await getProjectBySlug(params.slug);
  return { props: { project } };
}
```

### On Project Card (Discovery/Listing)

```javascript
// /src/components/ProjectCard.js

import ChainBadges from '@/components/showcase/ChainBadges';
import SectorBadges from '@/components/showcase/SectorBadges';

export default function ProjectCard({ project }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-bold">{project.name}</h3>
      <p className="text-gray-600 text-sm mb-3">{project.description}</p>

      {/* Badges - use compact mode for listings */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <ChainBadges chains={project.chains} compact={true} />
        </div>
        <div className="flex-1">
          <SectorBadges sectors={project.sectors} compact={true} />
        </div>
      </div>

      <a href={`/projects/${project.slug}`} className="text-blue-600">
        View Details →
      </a>
    </div>
  );
}
```

### On Portfolio Page

```javascript
// /src/pages/u/[username].js

import ProjectShowcase from '@/components/showcase/ProjectShowcase';

export default function PortfolioPage({ user, projects }) {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">{user.displayName}</h1>
        <p className="text-gray-600 mb-8">{user.bio}</p>
      </div>

      <div className="space-y-12">
        {projects.map((project) => (
          <div key={project.id}>
            <ProjectShowcase project={project} />
            <hr className="my-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Custom Integration (for specific needs)

### Just the Traction Card

```javascript
import TractionCard from '@/components/showcase/TractionCard';

export default function MyComponent() {
  return (
    <TractionCard 
      contractAddress="0x1F98431c8aD98523631AE4a59f267346ea3113FA"
      chain="ethereum"
    />
  );
}
```

### Just the Credibility Card

```javascript
import DeveloperCredibilityCard from '@/components/showcase/DeveloperCredibilityCard';

export default function MyComponent() {
  return (
    <DeveloperCredibilityCard
      owner="Uniswap"
      repo="v3-core"
    />
  );
}
```

### Just Chain Badges

```javascript
import ChainBadges from '@/components/showcase/ChainBadges';

// Expanded view
<ChainBadges chains={['ethereum', 'polygon', 'arbitrum']} />

// Compact dots
<ChainBadges chains={['ethereum', 'polygon']} compact={true} />
```

### Just Sector Badges

```javascript
import SectorBadges from '@/components/showcase/SectorBadges';

// Expanded view with emoji
<SectorBadges sectors={['defi', 'gaming']} />

// Compact dots
<SectorBadges sectors={['defi']} compact={true} />
```

## Data Requirements

### For TractionCard

```javascript
{
  contractAddress: "0x...",  // Required: 0x-prefixed hex string
  chain: "ethereum"          // Optional: ethereum | polygon | arbitrum | etc.
}
```

### For DeveloperCredibilityCard

```javascript
{
  owner: "github-username",  // Required
  repo: "repo-name"          // Required
}
```

### For ChainBadges

```javascript
{
  chains: ["ethereum", "polygon"],  // Array of chain names
  compact: false                     // true for dots, false for badges
}
```

### For SectorBadges

```javascript
{
  sectors: ["defi", "gaming"],  // Array of sector names
  compact: false                 // true for dots, false for badges
}
```

### For ProjectShowcase

```javascript
{
  id: "project-123",
  name: "Project Name",
  description: "Description",
  sectors: ["defi"],
  chains: ["ethereum"],
  contractAddresses: {
    ethereum: "0x...",
    polygon: "0x..."
  },
  github: {
    owner: "github-user",
    repo: "repo-name"
  },
  website: "https://...",
  twitter: "twitter-handle",
  discord: "https://discord.gg/...",
  // ... other project fields
}
```

## Styling Customization

All components use Tailwind CSS with dark mode support.

### Customize TractionCard colors

```javascript
// Override the component's styles by wrapping it
<div className="[&_.bg-white]:bg-blue-50">
  <TractionCard {...props} />
</div>
```

### Customize badge colors

Edit the `CHAIN_CONFIG` or `SECTOR_CONFIG` objects in:
- `/src/components/showcase/ChainBadges.js`
- `/src/components/showcase/SectorBadges.js`

Example:
```javascript
ethereum: {
  name: 'Ethereum',
  color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  // ... customize color here
}
```

## Common Issues & Solutions

### "Module not found" errors

Ensure `@/` alias is configured in `jsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Mock data not showing

In development, components return realistic mock data by default. This is intentional.

To verify:
1. Open DevTools → Console
2. Should see no errors
3. Cards should display with random metrics

### Real Dune/GitHub data in production

When ready, add environment variables:
```bash
NEXT_PUBLIC_DUNE_API_KEY=your_api_key
GITHUB_TOKEN=your_github_token
```

The services will automatically use real API calls instead of mock data.

### Styling conflicts

If dark mode isn't working:
1. Check that `dark:` class is on parent container
2. Verify Tailwind config has `darkMode: 'class'`
3. Check browser's color scheme preferences

## Performance Tips

### Avoid rendering all metrics at once

Instead of:
```javascript
// ❌ Bad: All metrics load simultaneously
<TractionCard {...props} />
<DeveloperCredibilityCard {...props} />
```

Do:
```javascript
// ✅ Good: Only load on tab click or scroll
import { useState } from 'react';

export default function ProjectPage({ project }) {
  const [showMetrics, setShowMetrics] = useState(false);

  return (
    <>
      <button onClick={() => setShowMetrics(true)}>
        Show Metrics
      </button>
      {showMetrics && (
        <>
          <TractionCard {...props} />
          <DeveloperCredibilityCard {...props} />
        </>
      )}
    </>
  );
}
```

### Cache busting

If you need fresh data (bypass 6h/24h cache):
```javascript
// Clear localStorage cache
localStorage.removeItem('dune_traction_0x...');
localStorage.removeItem('github_metrics_owner/repo');
```

## Next Integration Steps

1. **This week**: Integrate components on project detail page
2. **Next week**: Add to project card listings
3. **Week 3**: Add discovery filters for chain/sector
4. **Week 4**: Begin Phase 2 (Testing Campaigns)

---

For questions or issues, refer to:
- `PHASE_1_BUILD.md` — Complete Phase 1 documentation
- Component source files — Detailed JSDoc comments
- Tests (coming soon) — Jest test examples
