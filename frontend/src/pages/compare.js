/**
 * Project Comparison — select 2-3 projects and compare AI agent scores side-by-side.
 * Only shows real data from Firestore + cached agent results. No fake scores.
 */
import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { db as clientDb } from "@/lib/firebase/clientApp";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { useNanopayment } from "@/stores/walletStore";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { SkeletonCard } from "@/components/common/LoadingStates";

const MAX_COMPARE = 3;

export default function ComparePage() {
  const router = useRouter();
  const { payForAgent, isInitialized } = useNanopayment();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState({});
  const [analyzing, setAnalyzing] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Pre-select from query params
  useEffect(() => {
    const ids = router.query.ids?.split(",").filter(Boolean) || [];
    if (ids.length) setSelected(ids);
  }, [router.query.ids]);

  // Load available projects
  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(clientDb, "projects"), orderBy("name"), limit(50));
        const snap = await getDocs(q);
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleProject = useCallback((id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const analyzeProject = useCallback(async (projectId) => {
    setAnalyzing((prev) => ({ ...prev, [projectId]: true }));
    try {
      const result = await payForAgent("underwrite", { projectId });
      if (result.success && result.data) {
        setResults((prev) => ({ ...prev, [projectId]: result.data }));
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing((prev) => ({ ...prev, [projectId]: false }));
    }
  }, [payForAgent]);

  const analyzeAll = useCallback(async () => {
    for (const id of selected) {
      if (!results[id]) {
        await analyzeProject(id);
      }
    }
  }, [selected, results, analyzeProject]);

  const selectedProjects = projects.filter((p) => selected.includes(p.id));
  const filteredProjects = projects.filter(
    (p) =>
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Compare Projects | Proof of Ship</title>
      </Head>

      <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: "Compare" }]} />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            📊 Compare Projects
          </h1>
          <p className="text-sm text-secondary mt-1">
            Select up to {MAX_COMPARE} projects to compare AI agent scores side-by-side
          </p>
        </div>

        {/* Project selector */}
        <div className="bg-surface rounded-xl border border-default p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">
              Select Projects ({selected.length}/{MAX_COMPARE})
            </h3>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-primary focus:ring-1 focus:ring-teal-500 w-48"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-tertiary text-center py-4">
              No projects found.{" "}
              <Link href="/projects/new" className="text-teal-600 hover:underline">
                Submit one
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredProjects.map((p) => {
                const isSelected = selected.includes(p.id);
                const disabled = !isSelected && selected.length >= MAX_COMPARE;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProject(p.id)}
                    disabled={disabled}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                        : disabled
                        ? "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-muted cursor-not-allowed"
                        : "border-gray-200 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <p className="font-medium truncate">{p.name || p.id}</p>
                    {p.ecosystem && (
                      <p className="text-[10px] text-tertiary">{p.ecosystem}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison view */}
        {selected.length >= 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">
                Comparison ({selected.length} projects)
              </h3>
              <button
                onClick={analyzeAll}
                disabled={!isInitialized}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
              >
                {isInitialized ? "⚡ Analyze All with AI" : "Initialize wallet first"}
              </button>
            </div>

            <div className={`grid gap-4 ${selected.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
              {selectedProjects.map((project) => {
                const result = results[project.id];
                const isAnalyzing = analyzing[project.id];

                return (
                  <div
                    key={project.id}
                    className="bg-surface rounded-xl border border-default p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-primary text-sm">
                          {project.name || project.id}
                        </h4>
                        {project.ecosystem && (
                          <span className="text-[10px] text-tertiary">
                            {project.ecosystem}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleProject(project.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {project.description && (
                      <p className="text-xs text-secondary mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {isAnalyzing ? (
                      <div className="space-y-2">
                        <div className="animate-pulse h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                        <p className="text-[10px] text-gray-400 text-center">Analyzing...</p>
                      </div>
                    ) : result ? (
                      <div className="space-y-3">
                        {/* Health Score */}
                        <div className="text-center">
                          <div
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-xl font-bold ${
                              result.healthScore >= 70
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : result.healthScore >= 40
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {result.healthScore}
                          </div>
                          <p className="text-xs text-secondary mt-1">
                            Health Score
                          </p>
                        </div>

                        {/* Breakdown */}
                        {result.breakdown && (
                          <div className="space-y-1.5">
                            {Object.entries(result.breakdown).map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between text-xs">
                                <span className="text-secondary capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-teal-500 rounded-full"
                                      style={{ width: `${Math.min(100, (val / 25) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium w-6 text-right">
                                    {val}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recommendation */}
                        {result.recommendation && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-750 rounded-lg p-2">
                            {result.recommendation}
                          </p>
                        )}

                        {/* AI Analysis */}
                        {result.aiAnalysis && (
                          <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                            <p className="text-[10px] font-medium text-secondary mb-1">
                              AI Analysis
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                              {result.aiAnalysis}
                            </p>
                          </div>
                        )}

                        {/* Cache info */}
                        {result.cached && (
                          <p className="text-[10px] text-tertiary text-center">
                            Cached result from {result.cachedAge}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <button
                          onClick={() => analyzeProject(project.id)}
                          disabled={!isInitialized}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-xs transition-colors"
                        >
                          ⚡ Analyze ($0.05)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selected.length < 2 && selected.length > 0 && (
          <div className="text-center py-8 text-sm text-tertiary">
            Select at least one more project to compare
          </div>
        )}

        {selected.length === 0 && !loading && projects.length > 0 && (
          <div className="text-center py-12 bg-surface rounded-xl border border-default">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-secondary mb-2">
              Select 2-3 projects above to compare their AI scores
            </p>
            <p className="text-xs text-tertiary">
              Each analysis costs $0.05 USDC via x402 nanopayment
            </p>
          </div>
        )}
      </div>
    </>
  );
}
