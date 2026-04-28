import React from 'react';

/**
 * Empty State Illustrations
 * Consistent SVG illustrations for empty states across the app
 */

const defaultProps = {
  className: '',
  size: 120,
};

/**
 * Rocket illustration for empty projects
 */
export const EmptyProjects = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle */}
    <circle cx="60" cy="60" r="56" fill="var(--color-background-secondary)" />
    <circle cx="60" cy="60" r="48" fill="var(--color-surface)" />
    
    {/* Rocket body */}
    <path
      d="M60 20C60 20 40 35 40 55V75C40 82 45 88 52 88H68C75 88 80 82 80 75V55C80 35 60 20 60 20Z"
      fill="var(--color-primary)"
      fillOpacity="0.15"
    />
    <path
      d="M60 25C60 25 43 38 43 55V72C43 78 47 83 53 83H67C73 83 77 78 77 72V55C77 38 60 25 60 25Z"
      fill="var(--color-primary)"
    />
    
    {/* Rocket window */}
    <circle cx="60" cy="50" r="8" fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="2" />
    
    {/* Rocket fins */}
    <path d="M40 70L32 85H42V70H40Z" fill="var(--color-primary)" fillOpacity="0.7" />
    <path d="M80 70L88 85H78V70H80Z" fill="var(--color-primary)" fillOpacity="0.7" />
    
    {/* Rocket flame */}
    <path d="M50 88V98C50 100 54 102 60 102C66 102 70 100 70 98V88H50Z" fill="var(--color-warning)" />
    <path d="M54 88V95C54 97 56 99 60 99C64 99 66 97 66 95V88H54Z" fill="var(--color-error)" />
    
    {/* Stars */}
    <circle cx="25" cy="35" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="95" cy="45" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="30" cy="90" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="90" cy="25" r="2" fill="var(--color-text-tertiary)" />
  </svg>
);

/**
 * Magnifying glass illustration for empty search results
 */
export const EmptySearch = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="60" cy="60" r="56" fill="var(--color-background-secondary)" />
    <circle cx="60" cy="60" r="48" fill="var(--color-surface)" />
    
    {/* Magnifying glass circle */}
    <circle cx="52" cy="52" r="28" fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="4" />
    
    {/* Magnifying glass handle */}
    <line x1="72" y1="72" x2="92" y2="92" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round" />
    
    {/* Question mark inside */}
    <text x="52" y="60" textAnchor="middle" fill="var(--color-primary)" fontSize="28" fontWeight="bold" fontFamily="var(--font-geist-sans)">?</text>
    
    {/* Decorative dots */}
    <circle cx="30" cy="30" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="95" cy="40" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="88" cy="85" r="2" fill="var(--color-text-tertiary)" />
  </svg>
);

/**
 * Trophy illustration for empty hackathons
 */
export const EmptyHackathons = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="60" cy="60" r="56" fill="var(--color-background-secondary)" />
    <circle cx="60" cy="60" r="48" fill="var(--color-surface)" />
    
    {/* Trophy cup */}
    <path
      d="M40 30H80V45C80 58 70 68 60 68C50 68 40 58 40 45V30Z"
      fill="var(--color-warning)"
      fillOpacity="0.2"
    />
    <path
      d="M43 33H77V45C77 56 68 64 60 64C52 64 43 56 43 45V33Z"
      fill="var(--color-warning)"
    />
    
    {/* Trophy handles */}
    <path
      d="M40 33C35 33 30 38 30 45C30 52 35 55 40 55V33Z"
      fill="var(--color-warning)"
      fillOpacity="0.8"
    />
    <path
      d="M80 33C85 33 90 38 90 45C90 52 85 55 80 55V33Z"
      fill="var(--color-warning)"
      fillOpacity="0.8"
    />
    
    {/* Trophy stem */}
    <rect x="55" y="68" width="10" height="12" fill="var(--color-warning)" />
    
    {/* Trophy base */}
    <rect x="45" y="80" width="30" height="6" rx="2" fill="var(--color-warning)" />
    <rect x="40" y="86" width="40" height="8" rx="2" fill="var(--color-warning)" fillOpacity="0.8" />
    
    {/* Star on trophy */}
    <path
      d="M60 40L62 46H68L63 50L65 56L60 52L55 56L57 50L52 46H58L60 40Z"
      fill="var(--color-background)"
    />
    
    {/* Decorative elements */}
    <circle cx="25" cy="40" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="95" cy="55" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="30" cy="85" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="90" cy="90" r="2" fill="var(--color-text-tertiary)" />
  </svg>
);

/**
 * Coins illustration for empty funding states
 */
export const EmptyFunding = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="60" cy="60" r="56" fill="var(--color-background-secondary)" />
    <circle cx="60" cy="60" r="48" fill="var(--color-surface)" />
    
    {/* Back coin */}
    <ellipse cx="65" cy="45" rx="22" ry="8" fill="var(--color-success)" fillOpacity="0.4" />
    <rect x="43" y="45" width="44" height="16" fill="var(--color-success)" fillOpacity="0.4" />
    <ellipse cx="65" cy="61" rx="22" ry="8" fill="var(--color-success)" fillOpacity="0.4" />
    
    {/* Front coin */}
    <ellipse cx="55" cy="50" rx="25" ry="10" fill="var(--color-success)" fillOpacity="0.6" />
    <rect x="30" y="50" width="50" height="20" fill="var(--color-success)" />
    <ellipse cx="55" cy="70" rx="25" ry="10" fill="var(--color-success)" fillOpacity="0.8" />
    <ellipse cx="55" cy="50" rx="25" ry="10" fill="var(--color-success)" />
    
    {/* Dollar sign */}
    <text x="55" y="68" textAnchor="middle" fill="var(--color-background)" fontSize="20" fontWeight="bold">$</text>
    
    {/* Decorative sparkles */}
    <circle cx="25" cy="35" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="95" cy="40" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="90" cy="85" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="30" cy="90" r="1.5" fill="var(--color-text-tertiary)" />
  </svg>
);

/**
 * Wallet illustration for empty transactions
 */
export const EmptyTransactions = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="60" cy="60" r="56" fill="var(--color-background-secondary)" />
    <circle cx="60" cy="60" r="48" fill="var(--color-surface)" />
    
    {/* Wallet body */}
    <rect x="25" y="40" width="70" height="50" rx="6" fill="var(--color-primary)" fillOpacity="0.15" />
    <rect x="28" y="43" width="64" height="44" rx="4" fill="var(--color-primary)" />
    
    {/* Wallet flap */}
    <rect x="25" y="40" width="70" height="15" rx="4" fill="var(--color-primary)" fillOpacity="0.8" />
    
    {/* Card slot */}
    <rect x="33" y="60" width="30" height="20" rx="3" fill="var(--color-background)" fillOpacity="0.3" />
    
    {/* Clasp */}
    <circle cx="78" cy="75" r="8" fill="var(--color-background)" />
    <circle cx="78" cy="75" r="5" fill="var(--color-primary)" />
    
    {/* Decorative elements */}
    <circle cx="25" cy="30" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="95" cy="45" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="30" cy="95" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="90" cy="90" r="2" fill="var(--color-text-tertiary)" />
  </svg>
);

/**
 * Users illustration for empty teams
 */
export const EmptyTeam = ({ className = '', size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="60" cy="60" r="56" fill="var(--color-background-secondary)" />
    <circle cx="60" cy="60" r="48" fill="var(--color-surface)" />
    
    {/* Center user */}
    <circle cx="60" cy="48" r="16" fill="var(--color-primary)" />
    <path
      d="M40 78C40 68 48 62 60 62C72 62 80 68 80 78V82H40V78Z"
      fill="var(--color-primary)"
    />
    
    {/* Left user (background) */}
    <circle cx="38" cy="52" r="12" fill="var(--color-primary)" fillOpacity="0.4" />
    <path
      d="M24 75C24 67 30 62 38 62C46 62 52 67 52 75V78H24V75Z"
      fill="var(--color-primary)"
      fillOpacity="0.4"
    />
    
    {/* Right user (background) */}
    <circle cx="82" cy="52" r="12" fill="var(--color-primary)" fillOpacity="0.4" />
    <path
      d="M68 75C68 67 74 62 82 62C90 62 96 67 96 75V78H68V75Z"
      fill="var(--color-primary)"
      fillOpacity="0.4"
    />
    
    {/* Plus icon */}
    <circle cx="60" cy="60" r="12" fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="2" />
    <line x1="60" y1="54" x2="60" y2="66" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
    <line x1="54" y1="60" x2="66" y2="60" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
    
    {/* Decorative elements */}
    <circle cx="25" cy="35" r="2" fill="var(--color-text-tertiary)" />
    <circle cx="95" cy="35" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="30" cy="90" r="1.5" fill="var(--color-text-tertiary)" />
    <circle cx="90" cy="90" r="2" fill="var(--color-text-tertiary)" />
  </svg>
);

/**
 * Generic empty state component with icon and text
 */
export const EmptyState = ({
  icon = 'projects',
  title = 'Nothing here yet',
  description = 'Get started by creating your first item.',
  action,
  className = '',
  size = 120,
}) => {
  const icons = {
    projects: <EmptyProjects size={size} />,
    search: <EmptySearch size={size} />,
    hackathons: <EmptyHackathons size={size} />,
    funding: <EmptyFunding size={size} />,
    transactions: <EmptyTransactions size={size} />,
    team: <EmptyTeam size={size} />,
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="mb-6">
        {icons[icon] || icons.projects}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-secondary max-w-sm mb-4">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default {
  EmptyProjects,
  EmptySearch,
  EmptyHackathons,
  EmptyFunding,
  EmptyTransactions,
  EmptyTeam,
  EmptyState,
};
