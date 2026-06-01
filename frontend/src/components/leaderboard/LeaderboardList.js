/**
 * LeaderboardList — Generic row list for the `builders` and `backers` tabs.
 *
 * Thin wrapper that maps entries to LeaderboardRow.
 */

import LeaderboardRow from "./LeaderboardRow";

export default function LeaderboardList({ entries, type }) {
  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <LeaderboardRow key={entry.address || idx} entry={entry} rank={idx + 1} type={type} />
      ))}
    </div>
  );
}
