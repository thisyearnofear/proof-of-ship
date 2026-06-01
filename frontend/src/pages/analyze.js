/**
 * /analyze - AI Project Analysis
 *
 * Clean analysis flow: pick a project, get AI-powered insights.
 * QVAC local-first inference runs transparently when available -
 * users never see installation instructions or provider details.
 *
 * Provider chain: QVAC local -> Featherless cloud -> AIsa cloud -> Rule-based
 */

import React from "react";
import Head from "next/head";
import { useUser } from "@/stores/authStore";
import useAnalyzeProjects from "@/hooks/useAnalyzeProjects";
import useUserCreditScore from "@/hooks/useUserCreditScore";
import useAnalyzeProject from "@/hooks/useAnalyzeProject";
import useExplainCredit from "@/hooks/useExplainCredit";
import {
  AnalyzeHeader,
  ProjectSearch,
  CreditScoreCard,
  ProjectGrid,
  AnalysisResult,
  AnalysisLoading,
  AnalysisError,
} from "@/components/analyze";

export default function AnalyzePage() {
  const { currentUser } = useUser();
  const { filtered, loading, searchQuery, setSearchQuery } = useAnalyzeProjects();
  const userScore = useUserCreditScore(currentUser);
  const analyze = useAnalyzeProject();
  const explainCredit = useExplainCredit(userScore);

  return (
    <>
      <Head>
        <title>Analyze Projects | Proof of Ship</title>
        <meta
          name="description"
          content="Get AI-powered analysis of builder projects - scores, strengths, risks, and recommendations."
        />
      </Head>

      <div className="min-h-screen bg-surface-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <AnalyzeHeader />
          <ProjectSearch value={searchQuery} onChange={setSearchQuery} />

          {userScore && (
            <CreditScoreCard
              userScore={userScore}
              result={explainCredit.result}
              loading={explainCredit.loading}
              onExplain={explainCredit.run}
            />
          )}

          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Select a Project</h2>
            <ProjectGrid
              projects={filtered}
              loading={loading}
              selectedId={analyze.selected?.id}
              analyzing={analyze.loading}
              onSelect={analyze.run}
              searchQuery={searchQuery}
            />
          </div>

          {analyze.error && <AnalysisError message={analyze.error} />}
          {analyze.loading && <AnalysisLoading name={analyze.selected?.name} />}
          {analyze.result && !analyze.loading && (
            <AnalysisResult name={analyze.selected?.name} result={analyze.result} />
          )}
        </div>
      </div>
    </>
  );
}
