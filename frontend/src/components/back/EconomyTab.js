import React from "react";
import { Card } from "@/components/common/Card";
import NanopaymentWidget from "@/components/common/NanopaymentWidget";
import TransactionFeed from "@/components/common/TransactionFeed";
import CloakDemoPanel from "@/components/common/CloakDemoPanel";

export default function EconomyTab() {
  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">AI Analysis Workspace</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Set up your payment wallet once, then run AI analysis in a simple flow: choose a project, pay in USDC, review the result, and decide what to back.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[420px]">
            {[
              { icon: '🔭', name: 'Scout', cost: '$0.01', desc: 'Scans projects and recommends where to look first' },
              { icon: '📊', name: 'Underwriter', cost: '$0.05', desc: 'Scores a project and returns actionable analysis' },
              { icon: '✅', name: 'Verifier', cost: '$0.01', desc: 'Reviews code and reports whether automation is available' },
            ].map((agent) => (
              <div key={agent.name} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{agent.icon}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{agent.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{agent.desc}</p>
                <span className="text-xs font-bold text-teal-600">{agent.cost} USDC</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 border-amber-200 bg-amber-50/80 dark:bg-amber-900/10 dark:border-amber-800">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">1. Set up</p>
            <p className="text-gray-600 dark:text-gray-300">Choose demo mode to test or live mode to use real USDC.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">2. Run analysis</p>
            <p className="text-gray-600 dark:text-gray-300">Use Scout from Discover, or run an agent directly below.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">3. Review result</p>
            <p className="text-gray-600 dark:text-gray-300">Each response now shows whether it was live, demo, cached, or fallback output.</p>
          </div>
        </div>
      </Card>

      <CloakDemoPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Wallet & analysis setup</h3>
          <NanopaymentWidget compact={false} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent payment activity</h3>
          <TransactionFeed maxItems={15} />
        </div>
      </div>

      <Card className="p-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Setup wallet → pay in USDC → run AI analysis → inspect result source → decide what to back
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Fast stablecoin settlement on Arc · clearer demo/live states · fewer hidden fallbacks</p>
      </Card>
    </div>
  );
}
