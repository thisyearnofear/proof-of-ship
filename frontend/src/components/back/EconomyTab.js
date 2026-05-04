import React from "react";
import { Card } from "@/components/common/Card";
import NanopaymentWidget from "@/components/common/NanopaymentWidget";
import TransactionFeed from "@/components/common/TransactionFeed";
import CloakDemoPanel from "@/components/common/CloakDemoPanel";

export default function EconomyTab() {
  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Agentic Economy</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Pay-per-query AI analysis powered by x402 nanopayments on Circle&apos;s Arc L2. Each agent call costs fractions of a cent — settled instantly in USDC.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🔭', name: 'AI Scout', cost: '$0.01', desc: 'Scans all projects, recommends micro-backings' },
            { icon: '📊', name: 'AI Underwriter', cost: '$0.05', desc: 'Deep project health score with AI analysis' },
            { icon: '✅', name: 'AI Verifier', cost: '$0.01', desc: 'Automated PR code review and milestone verification' },
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
      </Card>

      {/* Cloak Privacy Demo */}
      <CloakDemoPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">💳 Agent Dashboard</h3>
          <NanopaymentWidget compact={false} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📜 Transaction History</h3>
          <TransactionFeed maxItems={15} />
        </div>
      </div>

      <Card className="p-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          User → 402 Payment Required → Circle Gateway settles USDC on Arc → AI Agent returns results → Agent pays AIsa for AI inference
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Zero gas fees · Sub-second settlement · Powered by Circle</p>
      </Card>
    </div>
  );
}
