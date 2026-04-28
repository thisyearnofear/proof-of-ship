import React from "react";
import Button from "@/components/common/Button";
import { useRouter } from "next/router";

/**
 * PaymentFlowSection - Visualizes the x402 nanopayment flow
 */
export function PaymentFlow() {
  const router = useRouter();

  return (
    <div className="py-12 sm:py-16 bg-gradient-to-b from-teal-50 to-white border-t border-teal-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold mb-4">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Powered by Arc & x402
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
            How x402 Nanopayments Work
          </h2>
          <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto">
            Instant, gasless micropayments powered by Circle's programmable USDC
          </p>
        </div>

        {/* Visual Flow Diagram */}
        <div className="relative max-w-4xl mx-auto mb-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Step 1: User */}
            <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm p-4 text-center">
              <div className="text-3xl mb-2">👤</div>
              <p className="text-xs font-semibold text-gray-900">You</p>
              <p className="text-[10px] text-gray-500">Click &ldquo;Analyze&rdquo;</p>
            </div>
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">402</span>
                <div className="w-full h-0.5 bg-gradient-to-r from-blue-300 to-teal-300 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-teal-400" />
                </div>
                <span className="text-xs text-gray-400 mt-1">USDC</span>
              </div>
            </div>
            <div className="md:hidden flex justify-center">
              <span className="text-gray-300 text-xl">↓</span>
            </div>
            {/* Step 2: Gateway */}
            <div className="bg-white rounded-xl border-2 border-teal-200 shadow-sm p-4 text-center">
              <div className="text-3xl mb-2">🔐</div>
              <p className="text-xs font-semibold text-gray-900">Circle Gateway</p>
              <p className="text-[10px] text-gray-500">Signs USDC on Arc</p>
            </div>
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">settle</span>
                <div className="w-full h-0.5 bg-gradient-to-r from-teal-300 to-purple-300 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-purple-400" />
                </div>
                <span className="text-xs text-gray-400 mt-1">result</span>
              </div>
            </div>
            <div className="md:hidden flex justify-center">
              <span className="text-gray-300 text-xl">↓</span>
            </div>
            {/* Step 3: AI Agent */}
            <div className="bg-white rounded-xl border-2 border-purple-200 shadow-sm p-4 text-center">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-xs font-semibold text-gray-900">AI Agent</p>
              <p className="text-[10px] text-gray-500">Returns analysis</p>
            </div>
          </div>
          {/* Secondary payment: Agent → AIsa */}
          <div className="mt-4 flex justify-center">
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2 inline-flex items-center gap-3 text-xs text-gray-500">
              <span>🤖 Our Agent</span>
              <span className="text-gray-300">→ pays →</span>
              <span>🧠 AIsa (LLM)</span>
              <span className="text-gray-300">→ settled on</span>
              <span className="font-semibold text-teal-600">Arc L2</span>
            </div>
          </div>
        </div>

        {/* Agent Pricing + CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium text-teal-700">
              🤖 Underwriter — $0.05
            </span>
            <span className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium text-teal-700">
              🔍 Scout — $0.01
            </span>
            <span className="px-3 py-1.5 bg-white border border-teal-200 rounded-lg text-xs font-medium text-teal-700">
              ✅ Verifier — $0.001
            </span>
          </div>
          <Button
            onClick={() => router.push("/back")}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 text-sm font-semibold"
          >
            ⚡ Try AI Agents
          </Button>
        </div>
      </div>
    </div>
  );
}
