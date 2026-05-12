import React, { useState, useEffect } from 'react';
import { CpuChipIcon, BoltIcon } from '@heroicons/react/24/solid';

const MOCK_ACTIVITIES = [
  "Verifier scanning repository 'ocean-protocol'...",
  "Underwriter approved credit boost for 'ship-it-fast'",
  "Scout found new alignment in Solana ecosystem",
  "Nanopayment of 0.005 USDC settled for 'dex-aggregator'",
  "Verifier validated commit #f2a4b1 on 'proof-of-ship'",
  "Agent 'Underwriter' updating reputation for Captain-Cook",
  "Scout identifying high-impact issues in 'web3-starter'",
  "Nanopayment for 'agent-kit' successfully distributed"
];

export default function LiveAgentTicker() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MOCK_ACTIVITIES.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
            {MOCK_ACTIVITIES[index]}
          </span>
        </div>

        <div className="ml-auto hidden sm:flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-green-500 rounded-full" />
            Active Verifiers: 124
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            TPS: 12.4
          </div>
        </div>
      </div>
    </div>
  );
}
