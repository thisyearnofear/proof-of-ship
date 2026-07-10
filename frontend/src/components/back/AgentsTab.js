/**
 * AgentsTab — unified AI hub: analyze, scout, compare, and wallet setup.
 * Replaces the former EconomyTab + standalone /analyze, /scout, /compare routes.
 */

import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Card } from "@/components/common/Card";
import TabBar from "@/components/common/TabBar";
import { AGENTS, AGENTS_INTRO } from "@/config/agents";
import { AGENT_MODES } from "@/config/navigation";
import AgentsSetupPanel from "./AgentsSetupPanel";

const AnalyzePanel = dynamic(() => import("./AnalyzePanel"), { ssr: false, loading: () => null });
const ScoutPanel = dynamic(() => import("./ScoutPanel"), { ssr: false, loading: () => null });
const ComparePanel = dynamic(() => import("./ComparePanel"), { ssr: false, loading: () => null });

const MODE_TABS = [
  { id: "analyze", label: "Analyze" },
  { id: "scout", label: "Scout" },
  { id: "compare", label: "Compare" },
  { id: "setup", label: "Wallet" },
];

/**
 * @param {string | string[] | undefined} mode
 * @returns {string}
 */
function resolveMode(mode) {
  const value = Array.isArray(mode) ? mode[0] : mode;
  if (value && AGENT_MODES.includes(value)) return value;
  return "analyze";
}

export default function AgentsTab() {
  const router = useRouter();
  const mode = resolveMode(router.query.mode);

  const setMode = (nextMode) => {
    const query = { tab: "agents" };
    if (nextMode !== "analyze") query.mode = nextMode;
    if (router.query.project) query.project = router.query.project;
    router.replace({ pathname: "/back", query }, undefined, { shallow: true });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Agents</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{AGENTS_INTRO}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[420px]">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{agent.icon}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{agent.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{agent.description}</p>
                <span className="text-xs font-bold text-teal-600">{agent.priceLabel} USDC</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <TabBar tabs={MODE_TABS} activeTab={mode} onChange={setMode} variant="pill" />

      {mode === "analyze" && <AnalyzePanel />}
      {mode === "scout" && <ScoutPanel />}
      {mode === "compare" && <ComparePanel />}
      {mode === "setup" && <AgentsSetupPanel />}
    </div>
  );
}
