/**
 * Projects Page - Multi-Ecosystem Project Explorer
 * Clean, organized view of all projects across different blockchain ecosystems
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { useReputation } from "@/contexts/ReputationContext";
import HybridDashboard from "@/components/dashboard/HybridDashboard";
import { Card } from "@/components/common/Card";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { NETWORK_CONFIGS } from "@/config/networks";
import { filterProjects } from "@/utils/projectUtils";

export default function ProjectsPage() {
  const router = useRouter();
  const { projectData, loading, errors } = useEnhancedGithub();
  const { userProfile } = useReputation();

  // Filters: ecosystem, chains, and sectors (multi)
  const [ecosystem, setEcosystem] = useState("all");
  const [chains, setChains] = useState([]); // array of string chain ids
  const [sectors, setSectors] = useState([]); // array of string sector ids

  // Initialize from query on mount
  useEffect(() => {
    const { ecosystem: ecoQ, chains: chainsQ, sectors: sectorsQ } = router.query || {};
    if (ecoQ && (ecoQ === "celo" || ecoQ === "base" || ecoQ === "linea" || ecoQ === "all")) {
      setEcosystem(String(ecoQ));
    }
    if (chainsQ) {
      const arr = Array.isArray(chainsQ) ? chainsQ : String(chainsQ).split(",");
      setChains(arr.filter(Boolean).map(String));
    }
    if (sectorsQ) {
      const arr = Array.isArray(sectorsQ) ? sectorsQ : String(sectorsQ).split(",");
      setSectors(arr.filter(Boolean).map(String));
    }
  }, [router.query]);

  // Sync query when filters change
  useEffect(() => {
    const q = {};
    if (ecosystem !== "all") q.ecosystem = ecosystem;
    if (chains.length > 0) q.chains = chains.join(",");
    if (sectors.length > 0) q.sectors = sectors.join(",");
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  }, [ecosystem, chains, sectors]);

  const handleProjectClick = (project) => {
    // Navigate to project detail page
    router.push(`/projects/${project.ecosystem}/${project.slug}`);
  };

  // Error state
  if (Object.keys(errors).length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Load Projects
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading project data. Please try
              refreshing the page.
            </p>
            <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-medium text-red-900 mb-2">Error Details:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key}>
                    • {key}: {error}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
        
      </div>
    );
  }

  // Build filtered dataset per-ecosystem
  const filteredData = useMemo(() => {
    const result = {};
    if (!projectData) return result;
    const ecosystems = ecosystem === "all" ? Object.keys(projectData) : [ecosystem];
    ecosystems.forEach((eco) => {
      const list = projectData[eco] || [];
      // Apply both chain and sector filters
      result[eco] = list.filter(p => {
        if (chains.length > 0 && (!p.chains || !p.chains.some(c => chains.includes(c)))) {
          return false;
        }
        if (sectors.length > 0 && (!p.sectors || !p.sectors.some(s => sectors.includes(s)))) {
          return false;
        }
        return true;
      });
    });
    return result;
  }, [projectData, ecosystem, chains, sectors]);

  // Chains list from NETWORK_CONFIGS — short labels only
  const chainOptions = useMemo(() => {
    const shortNames = {
      44787: 'Celo',
      59141: 'Linea',
      84532: 'Base',
      421614: 'Arbitrum',
      11155111: 'Ethereum',
      11155420: 'Optimism',
    };
    return Object.values(NETWORK_CONFIGS).map((c) => ({
      id: String(c.chainId),
      name: shortNames[c.chainId] || c.name,
    }));
  }, []);

  // Sector options
  const sectorOptions = [
    { id: 'defi', name: '💰 DeFi' },
    { id: 'gaming', name: '🎮 Gaming' },
    { id: 'rwa', name: '🏢 RWA' },
    { id: 'health', name: '🏥 Health' },
    { id: 'infrastructure', name: '🏗️ Infrastructure' },
    { id: 'social', name: '👥 Social' },
    { id: 'nft', name: '🖼️ NFT' },
    { id: 'dao', name: '🗳️ DAO' },
    { id: 'marketplace', name: '🛍️ Marketplace' },
    { id: 'bridge', name: '🌉 Bridge' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <Card className="p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ecosystem}
              onChange={(e) => setEcosystem(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs font-medium"
            >
              <option value="all">All Ecosystems</option>
              <option value="celo">Celo</option>
              <option value="base">Base</option>
              <option value="linea">Linea</option>
            </select>

            <span className="text-gray-300">|</span>

            {chainOptions.map((opt) => {
              const active = chains.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() =>
                    setChains((prev) =>
                      active ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                    )
                  }
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    active ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.name}
                </button>
              );
            })}

            <span className="text-gray-300">|</span>

            {sectorOptions.map((opt) => {
              const active = sectors.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() =>
                    setSectors((prev) =>
                      active ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                    )
                  }
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    active ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.name}
                </button>
              );
            })}

            {(chains.length > 0 || sectors.length > 0 || ecosystem !== 'all') && (
              <button
                onClick={() => { setEcosystem('all'); setChains([]); setSectors([]); }}
                className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:text-red-700"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </Card>

        <HybridDashboard
          projects={filteredData}
          loading={loading}
          userProfile={userProfile}
          onProjectClick={handleProjectClick}
        />
      </div>

    </div>
  );
}
