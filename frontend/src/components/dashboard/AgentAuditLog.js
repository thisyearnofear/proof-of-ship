import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Card } from '@/components/common/Card';
import {
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

function getAgentLabel(type) {
  switch (type) {
    case 'execution': return 'Executor';
    case 'scout': return 'Scout';
    case 'underwrite': return 'Underwriter';
    case 'verify': return 'Verifier';
    default: return 'Agent';
  }
}

function getAgentBadgeColor(type) {
  switch (type) {
    case 'execution': return 'bg-emerald-900/50 text-emerald-400';
    case 'scout': return 'bg-purple-900/50 text-purple-400';
    case 'underwrite': return 'bg-blue-900/50 text-blue-400';
    case 'verify': return 'bg-teal-900/50 text-teal-400';
    default: return 'bg-slate-800 text-slate-400';
  }
}

function getStatusIcon(status, type) {
  if (status === 'error' || status === 'failed') {
    return <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />;
  }
  if (type === 'execution') {
    return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
  }
  return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
}

function formatRunDetails(run) {
  const type = run.type || 'scout';
  if (type === 'execution') {
    const backed = run.totalBacked || 0;
    const failed = run.totalFailed || 0;
    const staked = run.totalStaked || 0;
    return `Executed ${backed} backing${backed !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''} — ${staked.toFixed(2)} USDC`;
  }
  if (type === 'scout') {
    const evaluated = run.projectsEvaluated || 0;
    const backed = run.projectsBacked || 0;
    const stake = run.totalStakeRecommended || 0;
    return `Evaluated ${evaluated} projects, recommended ${backed} — ${stake.toFixed(2)} USDC`;
  }
  if (type === 'underwrite') {
    return `Health score: ${run.healthScore || '?'}/100 — ${run.recommendation?.recommendation || 'analyzed'}`;
  }
  return run.ecosystemAnalysis || JSON.stringify(run.results || run.summary || {}).slice(0, 100);
}

export default function AgentAuditLog({ projectSlug }) {
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'agent_runs'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(newLogs);
    }, (error) => {
      console.warn('Agent audit log unavailable:', error.message);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = projectSlug
    ? logs.filter((l) =>
        l.project?.slug === projectSlug ||
        l.results?.some?.((r) => r.projectId === projectSlug)
      )
    : logs;

  return (
    <section>
      <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
        Agent Audit Trail
      </h2>
      <Card className="bg-slate-900 border-none overflow-hidden text-slate-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">Live Agent Runs</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono">{filteredLogs.length} RUNS</span>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center">
              <ArrowPathIcon className="w-5 h-5 text-slate-600 mx-auto mb-2 animate-spin" />
              <p className="text-slate-500 text-xs">Waiting for agent runs...</p>
            </div>
          )}
          {filteredLogs.slice(0, isExpanded ? 20 : 5).map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getAgentBadgeColor(log.type)}`}>
                    {getAgentLabel(log.type)}
                  </span>
                  <span className="text-xs font-medium text-slate-100">
                    {log.type === 'execution' ? 'On-Chain Backing' : log.type === 'scout' ? 'Portfolio Scan' : log.type === 'underwrite' ? 'Project Analysis' : 'Agent Run'}
                  </span>
                </div>
                {getStatusIcon(log.status, log.type)}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all">
                {formatRunDetails(log)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-slate-500 font-mono">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                </span>
                <Link
                  href={`/scout/trace/${log.id}`}
                  className="text-[9px] text-cyan-400 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View Trace →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest border-t border-slate-800"
        >
          {isExpanded ? 'Collapse Logs' : 'View Full Trail'}
        </button>
      </Card>
    </section>
  );
}
