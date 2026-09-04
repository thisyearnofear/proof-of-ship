/**
 * LandingPayoutStrip — live payout-speed proof for the landing page.
 * Reuses FastestPayoutHero when data exists; stays quiet when empty.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import FastestPayoutHero from "@/components/leaderboard/FastestPayoutHero";
import { LoadingSpinner } from "@/components/common/LoadingStates";

export default function LandingPayoutStrip() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/hackathons/leaderboard");
        if (!res.ok) throw new Error("Failed to load payout data");
        const data = await res.json();
        if (!cancelled) setEntries(data.hackathons || []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const hasSpeed = entries.some((e) => e.avgPayoutDays !== null && e.avgPayoutDays >= 0);

  return (
    <section className="border-t border-default bg-surface py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary">
              Payout truth, in public
            </h2>
            <p className="text-sm text-secondary mt-1 max-w-xl">
              How fast do hackathons actually pay winners? This is the ledger ecosystems feel pressure from.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="text-sm font-semibold text-amber-700 dark:text-amber-300 hover:underline"
          >
            Full payout leaderboard →
          </Link>
        </div>

        {hasSpeed ? (
          <FastestPayoutHero entries={entries} />
        ) : (
          <div className="rounded-xl border border-dashed border-default p-6 text-sm text-secondary">
            Payout-speed data is still filling in.{" "}
            <Link href="/leaderboard" className="text-amber-700 dark:text-amber-300 underline">
              Claim a win or report a payout
            </Link>{" "}
            to add the next data point.
          </div>
        )}
      </div>
    </section>
  );
}
