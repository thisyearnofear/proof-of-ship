/**
 * /analyze — Standalone QVAC On-Device Analysis Page
 *
 * Demonstrates QVAC (Tether's on-device AI) for project analysis and credit
 * score explanation. When @qvac/sdk is installed, inference runs entirely on
 * the user's device — no data leaves the browser. Falls back to the cloud
 * API with the same prompts when QVAC isn't available.
 *
 * Tracks: Tether Frontier Track ($10K)
 */

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { qvacService } from "@/services/QvacService";

export default function AnalyzePage() {
  // QVAC status
  const [qvacStatus, setQvacStatus] = useState({ available: false, modelLoaded: false, modelId: null, error: null });
  const [modelLoading, setModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(null);

  // Project analysis state
  const [selectedProject, setSelectedProject] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // Credit score explanation state
  const [creditResult, setCreditResult] = useState(null);
  const [explainingCredit, setExplainingCredit] = useState(false);

  // Projects list
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Check QVAC status on mount
  useEffect(() => {
    qvacService.getStatus().then(setQvacStatus).catch(() => {});
  }, []);

  // Load projects from Firestore
  useEffect(() => {
    async function loadProjects() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { collection, getDocs, query, where, limit: fbLimit } = await import("firebase/firestore");

        // Try loading from ecosystem collections
        const ecosystems = ['solana', 'celo', 'arc', 'base'];
        const all = [];

        for (const eco of ecosystems) {
          try {
            const ref = collection(db, `projects_${eco}`);
            const q = eco === 'base'
              ? query(ref, where('status', '==', 'approved'), fbLimit(10))
              : query(ref, fbLimit(10));
            const snap = await getDocs(q);
            snap.docs.forEach(doc => {
              const data = doc.data();
              if (data.description && data.description.length > 15) {
                all.push({ id: doc.id, ...data, ecosystem: eco });
              }
            });
          } catch { /* skip failed ecosystems */ }
        }

        setProjects(all);
      } catch (err) {
        console.warn('Failed to load projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  const handleLoadModel = async () => {
    setModelLoading(true);
    setModelProgress('Downloading model (Llama 3.2 1B, ~700MB)...');
    try {
      const ok = await qvacService.initialize();
      if (ok) {
        setQvacStatus(await qvacService.getStatus());
        setModelProgress('Model loaded — ready for on-device inference.');
      } else {
        setModelProgress('QVAC SDK not available. Install @qvac/sdk for local inference.');
      }
    } catch (err) {
      setModelProgress(`Failed: ${err.message}`);
    } finally {
      setModelLoading(false);
    }
  };

  const handleAnalyze = async (project) => {
    setSelectedProject(project);
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      let result;
      if (qvacStatus.available && qvacStatus.modelLoaded) {
        // On-device via QVAC
        result = await qvacService.analyzeProject({
          name: project.name,
          description: project.description || '',
          githubUrl: project.githubUrl || '',
          ecosystem: project.ecosystem || '',
        });
      } else {
        // Cloud fallback — call the same analysis via our API
        const res = await fetch('/api/agent/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: {
              name: project.name,
              description: project.description,
              githubUrl: project.githubUrl,
              ecosystem: project.ecosystem,
            },
          }),
        });
        if (!res.ok) throw new Error('Cloud analysis failed');
        const data = await res.json();
        result = { text: data.analysis, source: 'cloud-fallback' };
      }

      // Try parsing JSON from the response
      let parsed = null;
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch { /* not valid JSON — show raw text */ }

      setAnalysisResult({ ...result, parsed });
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExplainCredit = async () => {
    setExplainingCredit(true);
    setCreditResult(null);

    try {
      const scoreData = {
        reputation: 520,
        totalBacking: '2,400',
        milestonesCompleted: 3,
        milestonesTotal: 5,
      };

      let result;
      if (qvacStatus.available && qvacStatus.modelLoaded) {
        result = await qvacService.explainCreditScore(scoreData);
      } else {
        const res = await fetch('/api/agent/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'credit', scoreData }),
        });
        if (!res.ok) throw new Error('Cloud analysis failed');
        const data = await res.json();
        result = { text: data.analysis, source: 'cloud-fallback' };
      }

      setCreditResult(result);
    } catch (err) {
      setCreditResult({ text: `Error: ${err.message}`, source: 'error' });
    } finally {
      setExplainingCredit(false);
    }
  };

  const sourceBadge = (source) => {
    if (source === 'qvac-local') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
          On-Device (QVAC)
        </span>
      );
    }
    if (source === 'cloud-fallback') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
          Cloud API
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Analyze — On-Device AI | Proof of Ship</title>
        <meta name="description" content="AI-powered project analysis running on your device via QVAC. Privacy-preserving inference — your data never leaves the browser." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              On-Device AI Analysis
            </h1>
            <p className="text-gray-600">
              Privacy-preserving project analysis powered by QVAC. When the model runs locally,
              your data never leaves the browser.
            </p>
          </div>

          {/* QVAC Status Card */}
          <Card className="p-5 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔒</span>
                  <h2 className="text-lg font-bold text-gray-900">QVAC Status</h2>
                  {qvacStatus.available && qvacStatus.modelLoaded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white uppercase tracking-wider">
                      Active
                    </span>
                  )}
                  {qvacStatus.available && !qvacStatus.modelLoaded && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500 text-white uppercase tracking-wider">
                      SDK Installed — Model Not Loaded
                    </span>
                  )}
                  {!qvacStatus.available && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white uppercase tracking-wider">
                      Cloud Fallback
                    </span>
                  )}
                </div>

                {qvacStatus.available && qvacStatus.modelLoaded && (
                  <p className="text-sm text-green-700">
                    Running Llama 3.2 1B locally. Analysis runs on your GPU — no data sent to servers.
                  </p>
                )}
                {qvacStatus.available && !qvacStatus.modelLoaded && (
                  <p className="text-sm text-yellow-700">
                    QVAC SDK is installed but the model hasn't been loaded yet.
                  </p>
                )}
                {!qvacStatus.available && (
                  <p className="text-sm text-blue-700">
                    Using cloud API for analysis. Install @qvac/sdk and load the model for on-device inference.
                  </p>
                )}

                {modelProgress && (
                  <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-100 px-2 py-1 rounded">
                    {modelProgress}
                  </p>
                )}
              </div>

              {qvacStatus.available && !qvacStatus.modelLoaded && (
                <Button
                  onClick={handleLoadModel}
                  disabled={modelLoading}
                  className="flex items-center gap-2 text-sm"
                >
                  {modelLoading ? (
                    <><LoadingSpinner size="sm" /> Loading...</>
                  ) : (
                    <><span>🧠</span> Load Model</>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Credit Score Explanation */}
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📊</span> Credit Score Explanation
                </h2>
                <p className="text-sm text-gray-600">See how QVAC explains a builder's credit profile</p>
              </div>
              <Button
                variant="outline"
                onClick={handleExplainCredit}
                disabled={explainingCredit}
                className="text-sm"
              >
                {explainingCredit ? <><LoadingSpinner size="sm" /> Analyzing...</> : 'Explain Sample Score'}
              </Button>
            </div>
            {creditResult && (
              <div className="mt-3">
                {sourceBadge(creditResult.source)}
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {creditResult.text}
                </div>
                {creditResult.source === 'qvac-local' && (
                  <p className="text-[11px] text-green-600 mt-1">
                    This analysis ran entirely on your device. No financial data was sent to any server.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Project Analysis */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>🔍</span> Project Analysis
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a project to analyze. {qvacStatus.available && qvacStatus.modelLoaded
                ? 'Analysis will run on your device.'
                : 'Analysis uses the cloud API with the same prompts.'}
            </p>

            {loadingProjects ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
            ) : projects.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                No projects found. Submit a project first to see AI analysis.
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleAnalyze(project)}
                    disabled={analyzing}
                    className={`text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                      selectedProject?.id === project.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{project.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{project.ecosystem} · {project.category || 'General'}</p>
                        {project.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-blue-600 font-medium flex-shrink-0 ml-2">
                        {analyzing && selectedProject?.id === project.id ? '...' : 'Analyze'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Result */}
          {analyzing && (
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-3">
                <LoadingSpinner size="md" />
                <div>
                  <p className="font-medium text-gray-900">Analyzing {selectedProject?.name}...</p>
                  <p className="text-sm text-gray-500">
                    {qvacStatus.available && qvacStatus.modelLoaded
                      ? 'Running on your device via QVAC'
                      : 'Sending to cloud API'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {analysisError && (
            <Card className="p-5 mb-6 border-red-200 bg-red-50">
              <p className="text-sm text-red-700">{analysisError}</p>
            </Card>
          )}

          {analysisResult && !analyzing && (
            <Card className="p-5 mb-6 border-blue-200 bg-blue-50/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">
                  Analysis: {selectedProject?.name}
                </h3>
                {sourceBadge(analysisResult.source)}
              </div>

              {analysisResult.parsed ? (
                <div className="space-y-4">
                  {/* Score */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{analysisResult.parsed.score}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Score: {analysisResult.parsed.score}/100</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        analysisResult.parsed.recommendation === 'strong-back' ? 'bg-green-100 text-green-700' :
                        analysisResult.parsed.recommendation === 'moderate-back' ? 'bg-blue-100 text-blue-700' :
                        analysisResult.parsed.recommendation === 'watch' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {analysisResult.parsed.recommendation?.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  {analysisResult.parsed.summary && (
                    <p className="text-sm text-gray-700">{analysisResult.parsed.summary}</p>
                  )}

                  {/* Strengths & Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysisResult.parsed.strengths?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 uppercase mb-1">Strengths</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {analysisResult.parsed.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.parsed.risks?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase mb-1">Risks</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {analysisResult.parsed.risks.map((r, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-red-500 mt-0.5">-</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {analysisResult.text}
                </div>
              )}

              {analysisResult.source === 'qvac-local' && (
                <p className="text-[11px] text-green-600 mt-3 flex items-center gap-1">
                  <span>🔒</span>
                  This analysis ran entirely on your device. No project data was sent to any server.
                </p>
              )}
            </Card>
          )}

          {/* How it works */}
          <Card className="p-5 bg-gray-50 border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">How On-Device AI Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '🧠',
                  title: 'Load Model',
                  desc: 'Llama 3.2 1B (Q4_0) downloads to your browser. ~700MB, runs on WebGPU.',
                },
                {
                  icon: '🔒',
                  title: 'Private Inference',
                  desc: 'Project data stays on your device. No API calls, no telemetry, no tracking.',
                },
                {
                  icon: '☁️',
                  title: 'Cloud Fallback',
                  desc: 'When QVAC isn\'t available, the same prompts are sent to our cloud API.',
                },
              ].map((step) => (
                <div key={step.title} className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-2xl">{step.icon}</span>
                  <h4 className="text-sm font-semibold text-gray-900 mt-1">{step.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
