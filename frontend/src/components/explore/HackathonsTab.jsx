/**
 * HackathonsTab — Hackathons view of the Explore page. Fetches from
 * /api/hackathons with a status filter (all/upcoming/active/completed),
 * then renders groups of hackathon cards.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/common/Card";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { CalendarIcon, TrophyIcon, UsersIcon } from "@heroicons/react/24/outline";

const STATUS_GROUPS = [
  { key: "active", title: "Active", icon: <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />, bg: "bg-green-50" },
  { key: "upcoming", title: "Upcoming", icon: <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />, bg: "bg-blue-50" },
  { key: "completed", title: "Completed", icon: <TrophyIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />, bg: "bg-yellow-50" },
];

const FILTERS = ["all", "upcoming", "active", "completed"];

export default function HackathonsTab() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== "all") params.append("status", filter);
        const res = await fetch(`/api/hackathons?${params}`);
        if (!res.ok) throw new Error("Failed to fetch hackathons");
        const data = await res.json();
        if (!cancelled) setHackathons(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filter]);

  const grouped = useMemo(() => ({
    upcoming: hackathons.filter((h) => h.status === "upcoming"),
    active: hackathons.filter((h) => h.status === "active"),
    completed: hackathons.filter((h) => h.status === "completed"),
  }), [hackathons]);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (error) return <Card className="p-8 text-center"><p className="text-red-600 dark:text-red-400">⚠️ {error}</p></Card>;

  const empty = !grouped.upcoming.length && !grouped.active.length && !grouped.completed.length;

  return (
    <>
      <div className="flex gap-1 bg-surface rounded-lg p-1 border-default w-fit mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="text-center py-16">
          <TrophyIcon className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">No hackathons found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Hackathon data is loaded from the platform database. Check back soon or submit your hackathon project!
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm">
            <span>🏆</span>
            <span className="text-teal-700 font-medium">Currently building for: Arc Nano Payments Hackathon</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {STATUS_GROUPS.map(({ key, title, icon, bg }) => grouped[key].length > 0 && (
            <div key={key} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${bg}`}>{icon}</div>
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                <span className="text-gray-400 dark:text-gray-500 text-sm">({grouped[key].length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[key].map((h) => (
                  <Card key={h.id} className="hover:shadow-md transition-shadow">
                    <Link href={`/hackathons/${h.id}`} className="block p-5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                        {h.ecosystem?.toUpperCase()}
                      </span>
                      <h3 className="text-lg font-semibold text-primary mt-2">{h.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}
                      </p>
                      {h.prizePool && (
                        <p className="text-sm font-medium text-primary mt-2">${h.prizePool.toLocaleString()} in prizes</p>
                      )}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
