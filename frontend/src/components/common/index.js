/**
 * Common Components Library
 * Standardized, reusable components using design tokens
 */

// Layout Components
export { default as ThemeToggle } from './ThemeToggle';

// Form Components
export { 
  default as Input,
  Textarea,
  Select,
  Checkbox,
  Radio
} from './Input';

// Button Components
export { 
  default as Button,
  ButtonGroup,
  IconButton
} from './Button';

// Card Components
export { 
  default as Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  FeatureCard,
  ProjectCard
} from './Card';

// Modal Components
export { 
  default as Modal,
  ConfirmModal,
  AlertModal,
  Drawer
} from './Modal';

// Toast Components
export { 
  default as Toast,
  ToastProvider,
  useToast,
  useToastActions
} from './Toast';

// Progress Components
export {
  CircularProgress,
  CreditScoreCircular,
  MultiSegmentCircular
} from './CircularProgress';

// Illustration System
export {
  // Icons
  Icon,
  CustomIcons,
  IconWithCustom,
  NetworkIcon,
  StatusIcon,
  IconButtonWithIcon,
  
  // Loading States
  LoadingSpinner,
  PulsingDots,
  SkeletonLoader,
  CardSkeleton,
  DataLoadingIllustration,
  GitHubLoadingIllustration,
  CreditScoreLoadingIllustration,
  MetaMaskLoadingIllustration,
  LoadingState,
  
  // Empty States
  EmptyState,
  NoProjectsEmptyState,
  NoGitHubDataEmptyState,
  NoCreditDataEmptyState,
  NoWalletEmptyState,
  NoSearchResultsEmptyState,
  NoNotificationsEmptyState,
  NoFundingHistoryEmptyState,
  CustomEmptyState,
  
  // Error States
  ErrorState,
  NetworkErrorState,
  APIErrorState,
  GitHubErrorState,
  MetaMaskErrorState,
  CreditScoreErrorState,
  PermissionErrorState,
  NotFoundErrorState,
  ErrorBoundaryFallback,
  
  // Illustration System Utils
  IllustrationCategories,
  IllustrationSizes,
  IconCollections,
  CustomIconRegistry,
  IllustrationUtils,
  IllustrationPresets,
  createLoadingState,
  createEmptyState,
  createErrorState,
  withIllustration,
  IllustrationProvider,
  useIllustration
} from './illustrations';

// Re-export design tokens for component usage
export { default as tokens } from '../../styles/tokens';

// Component variants and utilities
export const componentVariants = {
  button: {
    primary: 'primary',
    secondary: 'secondary',
    ghost: 'ghost',
    danger: 'danger',
    success: 'success',
    warning: 'warning',
    outline: 'outline',
    link: 'link'
  },
  input: {
    default: 'default',
    error: 'error',
    success: 'success',
    disabled: 'disabled'
  },
  card: {
    default: 'default',
    elevated: 'elevated',
    outlined: 'outlined',
    ghost: 'ghost'
  },
  modal: {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    full: 'full'
  },
  toast: {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  },
  icon: {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl',
    '3xl': '3xl'
  },
  illustration: {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  },
  progress: {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
    '2xl': '2xl'
  }
};

// Common component sizes
export const componentSizes = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
  '3xl': '3xl'
};

// Utility functions for components
export const componentUtils = {
  // Generate consistent IDs for form elements
  generateId: (prefix = 'component') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Combine class names conditionally
  cn: (...classes) => {
    return classes.filter(Boolean).join(' ');
  },

  // Format display values
  formatValue: (value, type = 'text') => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      default:
        return value.toString();
    }
  },

  // Truncate text with ellipsis
  truncate: (text, length = 50) => {
    if (!text || text.length <= length) return text;
    return `${text.substring(0, length)}...`;
  },

  // Get initials from name
  getInitials: (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Get appropriate illustration based on state
  getStateIllustration: (state, context = 'default') => {
    switch (state) {
      case 'loading':
        return IllustrationUtils.getLoadingState(context);
      case 'empty':
        return IllustrationUtils.getEmptyState(context);
      case 'error':
        return IllustrationUtils.getErrorState(context);
      default:
        return null;
    }
  },

  // Credit score utilities
  getCreditTier: (score) => {
    if (score >= 800) return { tier: 'Excellent', color: '#22c55e' };
    if (score >= 700) return { tier: 'Good', color: '#3b82f6' };
    if (score >= 600) return { tier: 'Fair', color: '#f59e0b' };
    if (score >= 500) return { tier: 'Poor', color: '#f97316' };
    return { tier: 'Very Poor', color: '#ef4444' };
  },

  // Format credit score
  formatCreditScore: (score, maxScore = 850) => {
    return `${Math.round(score)}/${maxScore}`;
  }
};

// Component composition helpers
export const withToast = (Component) => {
  return (props) => {
    const toast = useToastActions();
    return <Component {...props} toast={toast} />;
  };
};

export const withLoadingState = (Component, loadingType = 'default') => {
  return (props) => {
    const { loading, ...restProps } = props;
    
    if (loading) {
      const LoadingComponent = IllustrationUtils.getLoadingState(loadingType);
      return <LoadingComponent />;
    }
    
    return <Component {...restProps} />;
  };
};

export const withErrorBoundary = (Component, errorType = 'default') => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Component error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        const ErrorComponent = IllustrationUtils.getErrorState('boundary');
        return (
          <ErrorComponent 
            error={this.state.error}
            resetError={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Common prop types for TypeScript-like validation
export const commonPropTypes = {
  size: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
  variant: ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning'],
  state: ['default', 'error', 'success', 'disabled'],
  position: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'],
  illustrationSize: ['sm', 'md', 'lg', 'xl'],
  iconColor: ['current', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'muted', 'white'],
  progressSize: ['sm', 'md', 'lg', 'xl', '2xl']
};

export default {
  componentVariants,
  componentSizes,
  componentUtils,
  commonPropTypes,
  withToast,
  withLoadingState,
  withErrorBoundary
};
