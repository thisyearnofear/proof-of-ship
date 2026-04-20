/**
 * Nanopayment Dashboard Widget
 * 
 * Mobile-responsive component showing:
 * - Gateway balance (available/locked)
 * - All AI agent services with pricing
 * - Live payment streaming visualization
 * - Transaction history
 * 
 * Part of Agentic Economy UX - hackathon submission
 */

import React, { useState, useEffect } from "react";
import { useNanopayment } from "@/contexts/NanopaymentContext";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import {
  CurrencyDollarIcon,
  ArrowPathIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CodeBracketIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const CURRENCY_SYMBOL = "$";

function formatUSDC(amount) {
  if (!amount) return `${CURRENCY_SYMBOL}0.00`;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0.00`;
  return `${CURRENCY_SYMBOL}${num.toFixed(2)}`;
}

const AGENT_SERVICES = [
  {
    id: "underwrite",
    name: "AI Underwriter",
    description: "Project health scoring",
    price: 0.05,
    icon: "🤖",
    color: "indigo",
  },
  {
    id: "scout",
    name: "AI Scout",
    description: "Portfolio recommendations",
    price: 0.01,
    icon: "🔭",
    color: "blue",
  },
  {
    id: "verify",
    name: "Verifier Agent",
    description: "Code verification (per 10 LOC)",
    price: 0.001,
    icon: "✅",
    color: "green",
  },
  {
    id: "rebalance",
    name: "AI Portfolio Manager",
    description: "Auto-rebalancing",
    price: 0.01,
    icon: "⚖️",
    color: "purple",
  },
];

export default function NanopaymentWidget({ compact = false, onPaymentComplete }) {
  const {
    isInitialized,
    loading,
    error,
    balance,
    walletAddress,
    transactions,
    streamingPayment,
    agentPrices,
    initializeWithDemo,
    deposit,
    payForAgent,
  } = useNanopayment();

  const [expanded, setExpanded] = useState(!compact);
  const [activeTab, setActiveTab] = useState("services");
  const [pendingService, setPendingService] = useState(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1");

  useEffect(() => {
    if (!isInitialized && process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      initializeWithDemo();
    }
  }, []);

  const handleServiceClick = async (service) => {
    if (!isInitialized) {
      await initializeWithDemo();
    }

    setPendingService(service.id);
    try {
      const result = await payForAgent(service.id);
      if (result.success) {
        onPaymentComplete?.(result);
      }
    } catch (err) {
      console.error("Payment failed:", err);
    } finally {
      setPendingService(null);
    }
  };

  const handleDeposit = async () => {
    try {
      await deposit(parseFloat(depositAmount));
      setShowDeposit(false);
      setDepositAmount("1");
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  if (!isInitialized && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return <UninitializedWidget onInitialize={initializeWithDemo} />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">Agentic Economy</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-indigo-200">Available</p>
              <p className="text-sm font-bold text-white">{formatUSDC(balance.available)}</p>
            </div>
            {expanded ? (
              <ChevronUpIcon className="w-5 h-5 text-white" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <TabButton 
              active={activeTab === "services"} 
              onClick={() => setActiveTab("services")}
            >
              Services
            </TabButton>
            <TabButton 
              active={activeTab === "activity"} 
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </TabButton>
            <TabButton 
              active={activeTab === "wallet"} 
              onClick={() => setActiveTab("wallet")}
            >
              Wallet
            </TabButton>
          </div>

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-3">
              {AGENT_SERVICES.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  loading={pendingService === service.id}
                  onClick={() => handleServiceClick(service)}
                  disabled={loading}
                />
              ))}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CurrencyDollarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No transactions yet</p>
                  <p className="text-xs text-gray-400">AI agents will earn USDC</p>
                </div>
              ) : (
                transactions.slice(0, 10).map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))
              )}
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <WalletCard label="Available" amount={balance.available} color="green" />
                <WalletCard label="Locked" amount={balance.locked} color="gray" />
              </div>

              {walletAddress && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Gateway Wallet</p>
                  <p className="text-xs font-mono text-gray-700 truncate">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              )}

              {!showDeposit ? (
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setShowDeposit(true)}
                >
                  <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                  Deposit USDC
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Amount"
                    />
                    <Button variant="primary" onClick={handleDeposit} disabled={loading}>
                      Deposit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Payment Stream - Shows during payment */}
      {streamingPayment && (
        <LivePaymentStream 
          agentType={streamingPayment.agentType}
          amount={streamingPayment.amount}
        />
      )}

      {/* Network Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-gray-400">Circle Gateway on Arc</span>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-indigo-500 text-indigo-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function ServiceCard({ service, loading, onClick, disabled }) {
  const isPending = loading;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className={`w-full p-3 rounded-lg border text-left transition-all ${
        isPending
          ? "border-indigo-300 bg-indigo-50"
          : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{service.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{service.name}</p>
            <p className="text-xs text-gray-500">{service.description}</p>
          </div>
        </div>
        <div className="text-right">
          {isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <span className="text-sm font-bold text-indigo-600">
              {formatUSDC(service.price)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function TransactionRow({ transaction }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm">{transaction.agentName || transaction.type}</span>
        {transaction.status === "confirmed" ? (
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
        ) : (
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
        )}
      </div>
      <span className="text-sm font-medium text-gray-700">
        -{formatUSDC(transaction.amount)}
      </span>
    </div>
  );
}

function WalletCard({ label, amount, color }) {
  const colorClasses = {
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-50 text-gray-700",
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-lg font-bold">{formatUSDC(amount)}</p>
    </div>
  );
}

function UninitializedWidget({ onInitialize }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="text-center">
        <SparklesIcon className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
        <h3 className="font-bold text-lg text-gray-900 mb-2">Connect Wallet</h3>
        <p className="text-sm text-gray-500 mb-4">
          Connect to access AI agent services via nanopayments
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-400 mb-2">Agent Pricing:</p>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">AI Underwriter:</span> $0.05/request</p>
            <p><span className="font-medium">AI Scout:</span> $0.01/run</p>
            <p><span className="font-medium">Verifier:</span> $0.001/10 LOC</p>
          </div>
        </div>
        <Button variant="primary" onClick={onInitialize}>
          Connect Demo Wallet
        </Button>
      </div>
    </div>
  );
}

function LivePaymentStream({ agentType, amount }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const agentNames = {
    underwrite: "AI Underwriter",
    scout: "AI Scout",
    verify: "Verifier Agent",
    rebalance: "AI Portfolio Manager",
  };

  return (
    <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-indigo-900">
          Streaming to {agentNames[agentType]}...
        </span>
        <span className="text-sm font-bold text-indigo-700">{formatUSDC(amount)}</span>
      </div>
      <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-indigo-600 mt-1">Settling via Circle Gateway</p>
    </div>
  );
}