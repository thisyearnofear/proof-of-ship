import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { 
  CpuChipIcon, 
  CommandLineIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const MOCK_LOGS = [
  {
    id: '1',
    agent: 'Underwriter',
    action: 'Codebase Quality Scan',
    status: 'completed',
    timestamp: Date.now() - 1000 * 60 * 5,
    details: 'Found 12 critical patterns, 45 enhancements. Quality score: 88/100'
  },
  {
    id: '2',
    agent: 'Scout',
    action: 'Ecosystem Alignment',
    status: 'in_progress',
    timestamp: Date.now() - 1000 * 60 * 2,
    details: 'Analyzing repository structure for Solana best practices...'
  },
  {
    id: '3',
    agent: 'Verifier',
    action: 'Nanopayment Settlement',
    status: 'completed',
    timestamp: Date.now() - 1000 * 60 * 15,
    details: 'Transaction 0x4f...a2 settled for $0.005 USDC'
  },
  {
    id: '4',
    agent: 'Underwriter',
    action: 'Reputation Audit',
    status: 'failed',
    timestamp: Date.now() - 1000 * 60 * 30,
    details: 'GitHub API rate limit exceeded. Retrying in 5 minutes.'
  }
];

export default function AgentAuditLog({ projectSlug }) {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />;
      case 'in_progress': return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />;
      default: return <ClockIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <section>
      <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
        Agent Audit Trail
      </h2>
      <Card className="bg-slate-900 border-none overflow-hidden text-slate-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-100 uppercase tracking-tight">Active Verifiers</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono">LIVE_LINK</span>
        </div>
        
        <div className="divide-y divide-slate-800">
          {logs.slice(0, isExpanded ? 10 : 3).map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    log.agent === 'Underwriter' ? 'bg-blue-900/50 text-blue-400' :
                    log.agent === 'Scout' ? 'bg-purple-900/50 text-purple-400' :
                    'bg-teal-900/50 text-teal-400'
                  }`}>
                    {log.agent}
                  </span>
                  <span className="text-xs font-medium text-slate-100">{log.action}</span>
                </div>
                {getStatusIcon(log.status)}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all">
                {log.details}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <button className="text-[9px] text-cyan-400 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                  View Trace →
                </button>
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
