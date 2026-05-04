/**
 * /analyze — AI Project Analysis with Local-First Inference
 *
 * Demonstrates the QVAC provider chain for project analysis and credit
 * score explanation. When a local QVAC server is running, inference happens
 * on the user's machine — project data never leaves the browser's localhost.
 * Falls back to cloud APIs (Featherless) with identical prompts when QVAC
 * isn't available.
 *
 * Provider chain: QVAC local → Featherless cloud → Rule-based fallback
 *
 * Tracks: Tether Frontier Track ($10K)
 * @see https://docs.qvac.tether.io/http-server/
 */

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { qvacService } from "@/services/QvacService";

export default function AnalyzePage() {
  // QVAC status — detected automatically, no manual "load model"
  const [qvacStatus, setQvacStatus] = useState({ available: false, modelLoaded: false, modelId: null, error: null });
  const [qvacChecking, setQvacChecking] = useState(true);

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

  // Check QVAC status on mount — tries to reach localhost:3000
  useEffect(() => {
    let mounted = true;
    setQvacChecking(true);
    qvacService.getStatus()
      .then(status => { if (mounted) setQvacStatus(status); })
      .catch(() => {})
      .finally(() => { if (mounted) setQvacChecking(false); });
    return () => { mounted = false; };
  }, []);

  // Load projects from Firestore
  useEffect(() => {
    async function loadProjects() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { collection, getDocs, query, where, limit: fbLimit } = await import("firebase/firestore");

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

  const handleRetryQvac = async () => {
    setQvacChecking(true);
    const status = await qvacService.refreshStatus();
    setQvacStatus(status);
    setQvacChecking(false);
  };

  const handleAnalyze = async (project) => {
    setSelectedProject(project);
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      // Re-check QVAC availability in case user started server since page load
      const currentStatus = await qvacService.getStatus();
      let result;

      if (currentStatus.available) {
        // Local-first: QVAC server on user's machine
        result = await qvacService.analyzeProject({
          name: project.name,
          description: project.description || '',
          githubUrl: project.githubUrl || '',
          ecosystem: project.ecosystem || '',
        });
      } else {
        // Cloud fallback: same prompts, same structure
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

      const currentStatus = await qvacService.getStatus();
      let result;

      if (currentStatus.available) {
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
          Cloud API (Featherless)
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Analyze — Local-First AI | Proof of Ship</title>
        <meta name="description" content="AI-powered project analysis with local-first inference via QVAC. When a local server is running, your data never leaves your machine." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Project Analysis
            </h1>
            <p className="text-gray-600">
              Analyze projects with local-first inference. When QVAC is running on your machine,
              analysis happens locally — your data never leaves your device.
            </p>
          </div>

          {/* QVAC Status Card */}
          <Card className={`p-5 mb-6 border ${
            qvacStatus.available
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-r from-slate-50 to-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔒</span>
                  <h2 className="text-lg font-bold text-gray-900">QVAC Status</h2>
                  {qvacChecking && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-400 text-white uppercase tracking-wider animate-pulse">
                      Checking...
                    </span>
                  )}
                  {!qvacChecking && qvacStatus.available && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white uppercase tracking-wider">
                      Local Server Active
                    </span>
                  )}
                  {!qvacChecking && !qvacStatus.available && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white uppercase tracking-wider">
                      Cloud Fallback
                    </span>
                  )}
                </div>

                {qvacStatus.available && (
                  <p className="text-sm text-green-700">
                    Connected to local QVAC server. Analysis runs on your GPU — project data stays on your machine.
                  </p>
                )}
                {!qvacChecking && !qvacStatus.available && (
                  <div className="text-sm text-gray-600">
                    <p>No local QVAC server detected. Analysis uses our cloud API (Featherless).</p>
                    <p className="mt-2 text-xs text-gray-500">
                      To enable local inference: install QVAC and start the server — your project data will never leave your machine.
                    </p>
                    <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs text-gray-700">
                      <div>npm install -g @qvac/sdk</div>
                      <div>qvac serve</div>
                    </div>
                  </div>
                )}
              </div>

              {!qvacChecking && !qvacStatus.available && (
                <Button
                  variant="outline"
                  onClick={handleRetryQvac}
                  className="text-xs flex-shrink-0"
                >
                  Retry Connection
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
                <p className="text-sm text-gray-600">See how AI explains a builder's credit profile</p>
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
                  <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                    <span>🔒</span> This analysis ran on your machine. No financial data was sent to any server.
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
              Select a project to analyze. {qvacStatus.available
                ? 'Analysis will run locally via QVAC — your data stays on your machine.'
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
                    {qvacStatus.available
                      ? 'Running on your machine via QVAC'
                      : 'Sending to cloud API (Featherless)'}
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
                  This analysis ran on your machine via QVAC. No project data was sent to any server.
                </p>
              )}
            </Card>
          )}

          {/* How it works */}
          <Card className="p-5 bg-gray-50 border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">How Local-First AI Works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '🧠',
                  title: 'Start QVAC Server',
                  desc: 'Install @qvac/sdk and run qvac serve. Llama 3.2 1B loads on your GPU. ~700MB download, runs via Vulkan/Metal.',
                },
                {
                  icon: '🔒',
                  title: 'Private Inference',
                  desc: 'When QVAC is detected, analysis runs locally. Project data never leaves your machine. No API calls, no telemetry.',
                },
                {
                  icon: '☁️',
                  title: 'Cloud Fallback',
                  desc: 'When QVAC isn\'t running, the same prompts go to our cloud API (Featherless). Same output structure, different privacy guarantees.',
                },
              ].map((step) => (
                <div key={step.title} className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-2xl">{step.icon}</span>
                  <h4 className="text-sm font-semibold text-gray-900 mt-1">{step.title}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Architecture:</strong> QvacService is provider-agnostic. The same analysis prompts and
                scoring structure are used regardless of where inference runs. When QVAC adds browser WebGPU
                support, or when users adopt the CLI, the integration is ready — no code changes needed.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
