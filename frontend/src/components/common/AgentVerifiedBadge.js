import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';

export const AgentVerifiedBadge = ({ agentName = 'Verifier', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold shadow-sm animate-pulse-slow ${sizeClasses[size]} ${className}`}>
      <div className="relative">
        <SparklesIcon className={`${iconClasses[size]} text-indigo-500`} />
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
      </div>
      <span>{agentName} Verified</span>
      <CheckBadgeIcon className={`${iconClasses[size]} text-indigo-400`} />
    </div>
  );
};

export default AgentVerifiedBadge;
