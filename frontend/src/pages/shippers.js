/**
 * Projects Page - Multi-Ecosystem Project Explorer
 * Clean, organized view of all projects across different blockchain ecosystems
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { useDecentralizedAuth } from "@/contexts/DecentralizedAuthContext";
import HybridDashboard from "@/components/dashboard/HybridDashboard";
import { Card } from "@/components/common/Card";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { NETWORK_CONFIGS } from "@/config/networks";
import { filterProjects } from "@/utils/projectUtils";

export default function ProjectsPage() {
  const router = useRouter();
  const { projectData, loading, errors } = useEnhancedGithub();
  const { userProfile } = useDecentralizedAuth();

  // Filters: ecosystem and chains (multi)
  const [ecosystem, setEcosystem] = useState("all");
  const [chains, setChains] = useState([]); // array of string chain ids

  // Initialize from query on mount
  useEffect(() => {
    const { ecosystem: ecoQ, chains: chainsQ } = router.query || {};
    if (ecoQ && (ecoQ === "celo" || ecoQ === "base" || ecoQ === "all")) {
      setEcosystem(String(ecoQ));
    }
    if (chainsQ) {
      const arr = Array.isArray(chainsQ) ? chainsQ : String(chainsQ).split(",");
      setChains(arr.filter(Boolean).map(String));
    }
  }, [router.query]);

  // Sync query when filters change
  useEffect(() => {
    const q = {};
    if (ecosystem !== "all") q.ecosystem = ecosystem;
    if (chains.length > 0) q.chains = chains.join(",");
    router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  }, [ecosystem, chains]);

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
      result[eco] = filterProjects(list, { chains });
    });
    return result;
  }, [projectData, ecosystem, chains]);

  // Chains list from NETWORK_CONFIGS
  const chainOptions = useMemo(() => {
    return Object.values(NETWORK_CONFIGS).map((c) => ({
      id: String(c.chainId),
      name: `${c.name} (${c.chainId})`,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Minimal Filter Bar */}
        <Card className="p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ecosystem</label>
              <select
                value={ecosystem}
                onChange={(e) => setEcosystem(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="celo">Celo</option>
                <option value="base">Base</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Chains</label>
              <div className="flex flex-wrap gap-2">
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
                      className={`px-2 py-1 rounded border text-xs ${
                        active ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>
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
