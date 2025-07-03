/**
 * Component Index
 * Centralized exports for clean imports throughout the application
 */

// Dashboard Components
export { default as HybridDashboard } from './dashboard/HybridDashboard';
export { default as EcosystemSection } from './dashboard/EcosystemSection';

// Project Components
export { 
  BaseProjectCard,
  ProjectPreviewCard,
  ProjectDetailCard,
  ProjectListItem,
  ProjectGridCard
} from './projects/ProjectCard';

// Onboarding Components
export { default as OnboardingFlow } from './onboarding/OnboardingFlow';

// Navigation Components
export { default as EcosystemNavigation } from './navigation/EcosystemNavigation';

// Credit Components
export { CreditDashboard } from './credit';

// Cross-Chain Components
export { default as CrossChainFunding } from './CrossChainFunding';

// Common Components (re-export for convenience)
export { Card } from './common/Card';
export { default as Button } from './common/Button';
export { Input } from './common/Input';
export { Modal } from './common/Modal';
export { LoadingSpinner } from './common/LoadingStates';
export { Navbar, Footer } from './common/layout';
