/**
 * useExplainCredit — runs AI credit-score explanation via QVAC
 * (local preferred, cloud fallback). Returns the latest result text
 * (or error) plus a run handler + loading state.
 */
import { useState, useCallback } from "react";
import { qvacService } from "@/services/QvacService";

const CLOUD_ENDPOINT = "/api/agent/analyze";

function buildScoreData(userScore) {
  return {
    reputation: userScore.reputation || userScore.creditScore || 0,
    totalBacking: String(userScore.totalBacking || 0),
    milestonesCompleted: userScore.milestonesCompleted || 0,
    milestonesTotal: userScore.milestonesTotal || 0,
  };
}

async function runProviderChain(scoreData) {
  const status = await qvacService.getStatus();
  if (status.available) {
    return qvacService.explainCreditScore(scoreData);
  }
  const res = await fetch(CLOUD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "credit", scoreData }),
  });
  if (!res.ok) throw new Error("Analysis failed");
  const data = await res.json();
  return { text: data.analysis, source: "cloud-fallback" };
}

export default function useExplainCredit(userScore) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    if (!userScore) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await runProviderChain(buildScoreData(userScore));
      setResult(data);
    } catch (err) {
      setResult({ text: `Error: ${err.message}`, source: "error" });
    } finally {
      setLoading(false);
    }
  }, [userScore]);

  return { result, loading, run };
}
