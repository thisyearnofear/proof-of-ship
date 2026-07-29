/**
 * BuilderXpCard — Shows builder level, XP progress, streak, and XP sources.
 *
 * Pure presentation driven by computeBuilderXp(). Designed to drop into
 * the builder profile or dashboard.
 */

import { useState } from "react";
import { RocketLaunchIcon, TrophyIcon, ShieldCheckIcon, GlobeAltIcon, StarIcon, UsersIcon, CommandLineIcon, FireIcon, CodeBracketIcon, CheckIcon, ShareIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/common/Card";
import { buildReferralUrl } from "@/lib/gamification/referral";

const ICON_MAP = {
  rocket: RocketLaunchIcon,
  trophy: TrophyIcon,
  shield: ShieldCheckIcon,
  globe: GlobeAltIcon,
  star: StarIcon,
  users: UsersIcon,
  anchor: CommandLineIcon,
};

export default function BuilderXpCard({ xp, username }) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const embedUrl = typeof window !== "undefined" && username
    ? `${window.location.origin}/api/badge?builder=${encodeURIComponent(username)}&type=proof`
    : "";
  const embedMarkdown = `[![Proof of Ship](${embedUrl})](https://proofofship.web.app/u/${username || ""})`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const referralUrl = username ? buildReferralUrl(username) : null;
  const handleCopyReferral = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl).then(() => {
        setRefCopied(true);
        setTimeout(() => setRefCopied(false), 2000);
      });
    }
  };
  if (!xp || xp.totalXp === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <RocketLaunchIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-sm font-bold text-primary">Start your journey</h3>
        <p className="text-xs text-secondary mt-1">
          Submit a project to earn XP and level up your builder profile.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      {/* Level header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30">
            <span className="text-lg font-extrabold text-white">{xp.level}</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Builder Level</p>
            <p className="text-base font-bold text-primary">{xp.levelTitle}</p>
          </div>
        </div>
        {xp.streak.current > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <FireIcon className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span className="text-sm font-bold text-orange-700 dark:text-orange-300">{xp.streak.current}</span>
            <span className="text-xs text-orange-600 dark:text-orange-400">streak</span>
          </div>
        )}
      </div>

      {/* XP progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-secondary mb-1.5">
          <span className="font-medium">{xp.totalXp.toLocaleString()} XP</span>
          <span>{xp.xpToNextLevel > 0 ? `${xp.xpToNextLevel.toLocaleString()} XP to Lv ${xp.level + 1}` : "Max level"}</span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${Math.min(100, xp.progressPct)}%` }}
          />
        </div>
      </div>

      {/* XP sources breakdown */}
      {xp.sources.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-tertiary mb-2">XP Breakdown</p>
          {xp.sources.map((source) => {
            const Icon = ICON_MAP[source.icon] || RocketLaunchIcon;
            return (
              <div key={source.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-secondary">
                  <Icon className="w-4 h-4 text-tertiary" />
                  <span>{source.label}</span>
                </div>
                <span className="font-semibold text-primary">+{source.xp.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Longest streak stat */}
      {xp.streak.longest > 1 && (
        <div className="pt-2 border-t border-default flex items-center justify-between text-xs text-tertiary">
          <span className="flex items-center gap-1">
            <FireIcon className="w-3.5 h-3.5" />
            Longest streak
          </span>
          <span className="font-medium">{xp.streak.longest} months</span>
        </div>
      )}

      {/* Embed in README */}
      {username && (
        <div className="pt-2 border-t border-default">
          <button
            onClick={() => setShowEmbed(!showEmbed)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <CodeBracketIcon className="w-3.5 h-3.5" />
            {showEmbed ? "Hide embed code" : "Embed in your README"}
          </button>
          {showEmbed && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <img src={embedUrl} alt="Proof of Ship badge" className="h-5" />
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] text-secondary bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5 truncate font-mono">
                  {embedMarkdown}
                </code>
                <button
                  onClick={handleCopyEmbed}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors flex-shrink-0"
                  title="Copy markdown"
                >
                  {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CodeBracketIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referral link */}
      {referralUrl && (
        <div className="pt-2 border-t border-default">
          <div className="flex items-center gap-1.5 mb-2">
            <ShareIcon className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-tertiary">Invite builders · +150 XP each</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] text-secondary bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5 truncate font-mono">
              {referralUrl}
            </code>
            <button
              onClick={handleCopyReferral}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors flex-shrink-0"
              title="Copy referral link"
            >
              {refCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ShareIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
