import React, { useState, useEffect } from "react";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

/**
 * Shows live backer activity for a project.
 * Real-time listener on the `backings` collection.
 */
export default function BackerActivity({ projectSlug }) {
  const [recentBackings, setRecentBackings] = useState([]);
  const [totalBackers, setTotalBackers] = useState(null);

  // Real-time count of active backings
  useEffect(() => {
    if (!projectSlug) return;
    const q = query(
      collection(db, "backings"),
      where("projectSlug", "==", projectSlug),
      where("status", "==", "active")
    );
    const unsub = onSnapshot(q, (snap) => setTotalBackers(snap.size), () => setTotalBackers(0));
    return () => unsub();
  }, [projectSlug]);

  // Real-time listener for recent backings (last 7 days)
  useEffect(() => {
    if (!projectSlug) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const q = query(
      collection(db, "backings"),
      where("projectSlug", "==", projectSlug),
      where("createdAt", ">", sevenDaysAgo),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecentBackings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => setRecentBackings([]));
    return () => unsub();
  }, [projectSlug]);

  if (recentBackings.length === 0 && (!totalBackers || totalBackers === 0)) return null;

  const timeAgo = (ts) => {
    if (!ts) return "";
    const d = typeof ts === "string" ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
        <span className="text-sm font-semibold text-green-900">
          {totalBackers !== null
            ? `${totalBackers} backer${totalBackers !== 1 ? "s" : ""}`
            : "Loading..."}
        </span>
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      </div>
      {recentBackings.length > 0 && (
        <div className="space-y-2">
          {recentBackings.map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CurrencyDollarIcon className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-gray-700 truncate flex-1">
                {b.backerName || "Someone"}
                {b.amount ? ` backed ${b.amount} USDC` : " backed this project"}
              </span>
              <span className="text-gray-400 flex-shrink-0">{timeAgo(b.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
