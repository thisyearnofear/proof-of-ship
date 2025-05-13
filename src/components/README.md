# Components Directory Structure

This directory contains all the React components used in the application, organized by functionality.

## Directory Structure

```
src/components/
├── auth/             # Authentication related components
├── common/           # Reusable UI components
│   ├── buttons/      # Button components
│   ├── cards/        # Card components
│   ├── layout/       # Layout components (Navbar, Footer)
│   ├── tables/       # Table components
│   └── Icons/        # Icon components
├── contracts/        # Contract related components
├── dashboard/        # Dashboard specific components
│   ├── cards/        # Dashboard card components
│   ├── charts/       # Chart components
│   └── stats/        # Statistics components
├── github/           # GitHub related components
├── projects/         # Project related components
└── social/           # Social media related components
```

## Usage

You can import components directly from their respective folders:

```jsx
import { ProjectCard, ProjectEditor } from '@/components/projects';
import { ContractUsageSection } from '@/components/contracts';
import { Login } from '@/components/auth';
```

Or you can import from the main components index file:

```jsx
import { 
  ProjectCard, 
  ContractUsageSection, 
  Login,
  StatCard
} from '@/components';
```

## Component Categories

### Auth Components
Components related to authentication, user profiles, and authorization.

### Common Components
Reusable UI components that can be used across the application.

### Contract Components
Components for displaying contract data, analytics, and transactions.

### Dashboard Components
Components specific to the dashboard pages.

### GitHub Components
Components for displaying GitHub data, issues, and pull requests.

### Project Components
Components for displaying and editing project information.

### Social Components
Components for displaying social media data and interactions.
