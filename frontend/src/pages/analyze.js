/**
 * /analyze — AI Project Analysis
 *
 * Clean analysis flow: pick a project, get AI-powered insights.
 * QVAC local-first inference runs transparently when available —
 * users never see installation instructions or provider details.
 *
 * Provider chain: QVAC local -> Featherless cloud -> AIsa cloud -> Rule-based
 */

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { qvacService } from "@/services/QvacService";
import { useUser } from "@/contexts/UserContext";
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function AnalyzePage() {
  const { currentUser } = useUser();

  const [selectedProject, setSelectedProject] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const [creditResult, setCreditResult] = useState(null);
  const [explainingCredit, setExplainingCredit] = useState(false);
  const [userScore, setUserScore] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load projects from Firestore
  useEffect(() => {
    async function loadProjects() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { collection, getDocs, query, where, limit: fbLimit } = await import("firebase/firestore");

        const ecosystems = ["solana", "celo", "arc", "base"];
        const all = [];

        for (const eco of ecosystems) {
          try {
            const ref = collection(db, `projects_${eco}`);
            const q = eco === "base"
              ? query(ref, where("status", "==", "approved"), fbLimit(10))
              : query(ref, fbLimit(10));
            const snap = await getDocs(q);
            snap.docs.forEach((doc) => {
              const data = doc.data();
              if (data.description && data.description.length > 15) {
                all.push({ id: doc.id, ...data, ecosystem: eco });
              }
            });
          } catch { /* skip failed ecosystems */ }
        }

        setProjects(all);
      } catch (err) {
        console.warn("Failed to load projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  // Load user's credit score if logged in
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function loadScore() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { doc, getDoc } = await import("firebase/firestore");
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && !cancelled) {
          const data = snap.data();
          if (data.creditScore || data.reputation) {
            setUserScore(data);
          }
        }
      } catch { /* ignore */ }
    }
    loadScore();
    return () => { cancelled = true; };
  }, [currentUser]);

  const handleAnalyze = async (project) => {
    setSelectedProject(project);
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const projectData = {
        name: project.name,
        description: project.description || "",
        githubUrl: project.githubUrl || "",
        ecosystem: project.ecosystem || "",
      };

      const currentStatus = await qvacService.getStatus();
      let result;

      if (currentStatus.available) {
        result = await qvacService.analyzeProject(projectData);
      } else {
        const res = await fetch("/api/agent/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: projectData }),
        });
        if (!res.ok) throw new Error("Analysis failed — try again");
        const data = await res.json();
        result = { text: data.analysis, source: "cloud-fallback" };
      }

      let parsed = null;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch { /* show raw text */ }

      setAnalysisResult({ ...result, parsed });
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExplainCredit = async () => {
    if (!userScore) return;
    setExplainingCredit(true);
    setCreditResult(null);

    try {
      const scoreData = {
        reputation: userScore.reputation || userScore.creditScore || 0,
        totalBacking: String(userScore.totalBacking || 0),
        milestonesCompleted: userScore.milestonesCompleted || 0,
        milestonesTotal: userScore.milestonesTotal || 0,
      };

      const currentStatus = await qvacService.getStatus();
      let result;

      if (currentStatus.available) {
        result = await qvacService.explainCreditScore(scoreData);
      } else {
        const res = await fetch("/api/agent/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "credit", scoreData }),
        });
        if (!res.ok) throw new Error("Analysis failed");
        const data = await res.json();
        result = { text: data.analysis, source: "cloud-fallback" };
      }

      setCreditResult(result);
    } catch (err) {
      setCreditResult({ text: `Error: ${err.message}`, source: "error" });
    } finally {
      setExplainingCredit(false);
    }
  };

  const filtered = searchQuery.trim()
    ? projects.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.ecosystem?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  return (
    <>
      <Head>
        <title>Analyze Projects | Proof of Ship</title>
        <meta
          name="description"
          content="Get AI-powered analysis of builder projects — scores, strengths, risks, and recommendations."
        />
      </Head>

      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              AI Project Analysis
            </h1>
            <p className="text-text-secondary max-w-2xl">
              Get instant AI-powered insights on any project — strengths, risks,
              and a recommendation score. Select a project below or search by name.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search projects to analyze..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-primary bg-surface-primary text-text-primary placeholder:text-text-tertiary text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Credit Score Explanation — only if user has a score */}
          {userScore && (
            <Card className="p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    Your Credit Profile
                  </h2>
                  <p className="text-sm text-text-secondary">
                    AI explanation of your builder credit score
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExplainCredit}
                  disabled={explainingCredit}
                  className="text-sm"
                >
                  {explainingCredit ? (
                    <>
                      <LoadingSpinner size="sm" /> Analyzing...
                    </>
                  ) : (
                    "Explain My Score"
                  )}
                </Button>
              </div>

              {creditResult && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <SourceBadge source={creditResult.source} />
                    <span className="text-sm font-medium text-text-primary">
                      Score: {userScore.reputation || userScore.creditScore || "N/A"}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-secondary rounded-lg text-sm text-text-secondary whitespace-pre-wrap">
                    {creditResult.text}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Project Grid */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">
              Select a Project
            </h2>

            {loadingProjects ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center text-text-secondary">
                {searchQuery
                  ? `No projects matching "${searchQuery}"`
                  : "No projects found. Submit a project first to see AI analysis."}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleAnalyze(project)}
                    disabled={analyzing}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                      selectedProject?.id === project.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-border-primary bg-surface-primary hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-text-primary text-sm truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {project.ecosystem} · {project.category || "General"}
                        </p>
                      </div>
                      {analyzing && selectedProject?.id === project.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <span className="text-xs text-indigo-600 font-medium flex-shrink-0 ml-2">
                          Analyze
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Error */}
          {analysisError && (
            <Card className="p-5 mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">{analysisError}</p>
            </Card>
          )}

          {/* Analysis Result */}
          {analysisResult && !analyzing && (
            <Card className="p-6 mb-6 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  {selectedProject?.name}
                </h3>
                <SourceBadge source={analysisResult.source} />
              </div>

              {analysisResult.parsed ? (
                <div className="space-y-5">
                  {/* Score Circle */}
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">
                        {analysisResult.parsed.score}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">
                        {analysisResult.parsed.score}/100
                      </p>
                      <span
                        className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                          analysisResult.parsed.recommendation === "strong-back"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : analysisResult.parsed.recommendation === "moderate-back"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : analysisResult.parsed.recommendation === "watch"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {analysisResult.parsed.recommendation?.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  {analysisResult.parsed.summary && (
                    <p className="text-sm text-text-secondary">
                      {analysisResult.parsed.summary}
                    </p>
                  )}

                  {/* Strengths & Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysisResult.parsed.strengths?.length > 0 && (
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                        <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider mb-2">
                          Strengths
                        </p>
                        <ul className="text-sm text-text-secondary space-y-1.5">
                          {analysisResult.parsed.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.parsed.risks?.length > 0 && (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-2">
                          Risks
                        </p>
                        <ul className="text-sm text-text-secondary space-y-1.5">
                          {analysisResult.parsed.risks.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-red-500 mt-0.5 flex-shrink-0">-</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-surface-secondary rounded-lg text-sm text-text-secondary whitespace-pre-wrap">
                  {analysisResult.text}
                </div>
              )}
            </Card>
          )}

          {/* Analyzing spinner */}
          {analyzing && (
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="md" />
                <div>
                  <p className="font-medium text-text-primary">
                    Analyzing {selectedProject?.name}...
                  </p>
                  <p className="text-sm text-text-tertiary">
                    Running AI analysis — results in a few seconds
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function SourceBadge({ source }) {
  if (source === "qvac-local") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
        <ShieldCheckIcon className="w-3 h-3" />
        On-Device
      </span>
    );
  }
  if (source === "cloud-fallback" || source === "cloud") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
        Cloud
      </span>
    );
  }
  return null;
}
