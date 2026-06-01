/**
 * HackathonLeaderboardList — Thin wrapper that maps entries to rows.
 *
 * Kept separate from HackathonLeaderboardRow to keep the import site
 * (the page) agnostic to how the list is rendered.
 */

import HackathonLeaderboardRow from "./HackathonLeaderboardRow";

export default function HackathonLeaderboardList({ entries }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <HackathonLeaderboardRow key={`${entry.name}-${idx}`} entry={entry} rank={idx + 1} />
      ))}
    </div>
  );
}
