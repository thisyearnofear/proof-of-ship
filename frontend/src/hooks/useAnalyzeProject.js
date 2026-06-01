/**
 * useAnalyzeProject — runs AI analysis on a project via QVAC (local
 * preferred, cloud fallback). Tracks selected project, loading,
 * error, and parsed JSON result (when the model returns JSON).
 */
import { useState, useCallback } from "react";
import { qvacService } from "@/services/QvacService";

const CLOUD_ENDPOINT = "/api/agent/analyze";

function parseJsonFromText(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

async function runProviderChain(projectData) {
  const status = await qvacService.getStatus();
  if (status.available) {
    return qvacService.analyzeProject(projectData);
  }
  const res = await fetch(CLOUD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectData }),
  });
  if (!res.ok) throw new Error("Analysis failed - try again");
  const data = await res.json();
  return { text: data.analysis, source: "cloud-fallback" };
}

export default function useAnalyzeProject() {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (project) => {
    setSelected(project);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const projectData = {
        name: project.name,
        description: project.description || "",
        githubUrl: project.githubUrl || "",
        ecosystem: project.ecosystem || "",
      };
      const raw = await runProviderChain(projectData);
      setResult({ ...raw, parsed: parseJsonFromText(raw.text) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { selected, result, loading, error, run };
}
