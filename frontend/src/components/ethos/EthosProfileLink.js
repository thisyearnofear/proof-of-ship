import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import ethosService from '@/services/EthosService';

/**
 * EthosProfileLink - Link to view full Ethos profile
 * @param {Object} props
 * @param {string} props.address - Wallet address
 * @param {string} props.username - Ethos username (optional)
 * @param {string} props.children - Link text (default: "View Ethos Profile")
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Whether to show external link icon (default: true)
 */
export default function EthosProfileLink({
  address,
  username,
  children = 'View Ethos Profile',
  className = '',
  showIcon = true,
}) {
  const identifier = username || address;
  
  if (!identifier) {
    return null;
  }

  const profileUrl = ethosService.getProfileUrl(identifier);

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline ${className}`}
    >
      <span>{children}</span>
      {showIcon && <ArrowTopRightOnSquareIcon className="w-4 h-4" />}
    </a>
  );
}
