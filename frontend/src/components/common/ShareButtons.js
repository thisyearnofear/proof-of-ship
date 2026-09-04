/**
 * Social share buttons for projects and AI scores
 */
import React from 'react';

export default function ShareButtons({ title, url, score, className = '' }) {
  const shareText = score
    ? `${title} scored ${score}/100 on PledgeBond 🚀`
    : `Check out ${title} on PledgeBond 🚀`;

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url || (typeof window !== 'undefined' ? window.location.href : ''));

  const links = [
    {
      name: 'X',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Farcaster',
      icon: '🟣',
      href: `https://warpcast.com/~/compose?text=${encodedText}%20${encodedUrl}`,
    },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">Share:</span>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={`Share on ${link.name}`}
        >
          <span>{link.icon}</span>
          <span>{link.name}</span>
        </a>
      ))}
    </div>
  );
}
