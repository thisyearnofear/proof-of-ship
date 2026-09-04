/**
 * ShareButton — X (Twitter) + Farcaster share for a leaderboard entry.
 *
 * Builds a shareable URL using the `?ref=` convention that the page uses
 * for highlighting entries (and rendering OG cards). Fires an analytics
 * event on click.
 */

import { trackEvent } from "@/lib/analytics";
import { generateShareText } from "./tabs";

export default function ShareButton({ text, url, entryType, entry, rank }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pledgebond.com";
  const ogRef = entryType && entry && rank ? `${entryType}-${rank}` : null;
  const shareUrl = url || (ogRef ? `${baseUrl}/leaderboard?ref=${ogRef}` : `${baseUrl}/leaderboard`);

  const handleShare = (platform) => {
    trackEvent("leaderboard_share_clicked", {
      platform,
      entry_type: entryType,
      rank,
      entry_name: entry?.name || entry?.title || null,
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleShare("x");
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text || generateShareText(entry, rank, entryType))}&url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer");
        }}
        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-blue-500 dark:text-blue-400 transition-colors"
        title="Share on X"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleShare("farcaster");
          const fcText = (text || generateShareText(entry, rank, entryType)).replace(/@pledgebond/g, "").trim();
          window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(fcText)}%20${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer");
        }}
        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-purple-500 dark:text-purple-400 transition-colors"
        title="Share on Farcaster"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.336 2.1h11.328l-.84 10.257L12 14.1l-4.824-1.743L6.336 2.1zM4.2 5.556l.672 8.166H8.4l.42 4.176h3.18l.42-4.176h3.528l.672-8.166H4.2z" />
        </svg>
      </button>
    </div>
  );
}
