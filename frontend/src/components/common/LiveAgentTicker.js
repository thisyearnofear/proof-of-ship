import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { CpuChipIcon, BoltIcon } from '@heroicons/react/24/solid';

function formatAgentRun(run) {
  const type = run.type || 'scout';
  const agent = type === 'execution' ? 'Executor' : type === 'scout' ? 'Scout' : type === 'underwrite' ? 'Underwriter' : 'Agent';
  const evaluated = run.projectsEvaluated || run.projects?.length || 0;
  const backed = run.projectsBacked || run.backed || 0;
  const totalStake = run.totalStakeRecommended || run.totalStaked || 0;

  if (type === 'execution') {
    return `${agent} executed ${backed} backing${backed !== 1 ? 's' : ''} — ${totalStake.toFixed(2)} USDC on Arc`;
  }
  if (type === 'scout') {
    return `${agent} evaluated ${evaluated} projects, recommended ${backed} — ${totalStake.toFixed(2)} USDC`;
  }
  if (type === 'underwrite') {
    return `${agent} scored project ${run.project?.name || run.projectId || 'unknown'} — ${run.healthScore || '?'}/100`;
  }
  return `${agent} completed run — ${evaluated} evaluated, ${backed} backed`;
}

export default function LiveAgentTicker() {
  const [runs, setRuns] = useState([]);
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Subscribe to real agent runs
  useEffect(() => {
    const q = query(
      collection(db, 'agent_runs'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRuns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRuns(newRuns);
    });

    return () => unsubscribe();
  }, []);

  // Rotate through activities
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => {
          const len = Math.max(runs.length, 1);
          return (prev + 1) % len;
        });
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [runs.length]);

  const activeRun = runs[index];
  const displayText = activeRun ? formatAgentRun(activeRun) : 'Waiting for agent activity...';

  // Compute live stats from real data
  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) =>
    r.type === 'execution' ? (r.totalBacked || 0) > 0 : (r.projectsBacked || r.backed || 0) > 0
  ).length;

  return (
    <div className="bg-slate-900 text-cyan-400 py-1.5 px-4 overflow-hidden border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <CpuChipIcon className="w-4 h-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-slate-900" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Agent Network:</span>
        </div>

        <div className={`flex items-center gap-2 transition-all duration-500 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <BoltIcon className="w-3 h-3 text-amber-400 animate-pulse" />
          <span className="text-[11px] font-mono font-medium truncate">
            {displayText}
          </span>
        </div>

        <div className="ml-auto hidden sm:flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-green-500 rounded-full" />
            Agent Runs: {totalRuns}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            Successful: {successfulRuns}
          </div>
        </div>
      </div>
    </div>
  );
}
