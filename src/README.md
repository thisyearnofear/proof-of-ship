# Source Code Structure

This directory contains the source code for the POS Dashboard application. The code is organized into the following directories:

## Directory Structure

```
src/
├── components/       # React components
│   ├── auth/         # Authentication components
│   ├── common/       # Reusable UI components
│   │   ├── buttons/  # Button components
│   │   ├── cards/    # Card components
│   │   ├── layout/   # Layout components (Navbar, Footer)
│   │   ├── tables/   # Table components
│   │   └── Icons/    # Icon components
│   ├── contracts/    # Contract-related components
│   ├── dashboard/    # Dashboard-specific components
│   ├── github/       # GitHub-related components
│   ├── projects/     # Project-related components
│   └── social/       # Social media components
├── constants/        # Constant values and configuration
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and libraries
│   └── firebase/     # Firebase configuration and utilities
├── pages/            # Next.js pages
│   └── api/          # API routes
├── providers/        # Provider components
├── styles/           # CSS and styling files
└── utils/            # Utility functions
```

## Import Guidelines

### Importing Components

Components should be imported from their respective directories using the index.js files:

```jsx
// Import from specific component category
import { StatCard } from '@/components/common/cards';
import { Navbar, Footer } from '@/components/common/layout';
import { ContractUsageSection } from '@/components/contracts';
import { Login } from '@/components/auth';

// Or import from the main components index
import { 
  StatCard, 
  Navbar, 
  Footer, 
  ContractUsageSection, 
  Login 
} from '@/components';
```

### Adding New Components

When adding new components:

1. Place the component in the appropriate directory based on its functionality
2. Update the index.js file in that directory to export the new component
3. If needed, update the main components/index.js file

### Migrating Existing Components

When working with existing components that haven't been migrated to the new structure:

1. Move the component to the appropriate directory
2. Update the component's imports to use the new structure
3. Update the index.js files to export the component
4. Update imports in files that use the component

## Best Practices

- Keep components focused on a single responsibility
- Use common components for reusable UI elements
- Group related components together in the same directory
- Use index.js files for clean exports
- Update imports to use the new structure as you work on files
