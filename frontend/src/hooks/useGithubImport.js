/**
 * useGithubImport — auto-populate project fields from a GitHub URL.
 *
 * Two side effects run when `githubUrl` changes:
 *   1. fetch metadata from `/api/projects/import-github` (when URL is new
 *      and belongs to the authenticated user) and merge into form
 *   2. debounced check for duplicate projects on the same repo URL
 *
 * Returns the import metadata for use in the preview panel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { parseGitHubRepoUrl } from "@/lib/projects/githubRepo";
import { checkDuplicateGitHubUrl } from "@/lib/projects/projectNormalize";

export function useGithubImport({ githubUrl, isEditMode, githubUsername, setForm, setError }) {
  const [fetchingGithub, setFetchingGithub] = useState(false);
  const [imported, setImported] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const lastUrlRef = useRef(githubUrl);

  const fetchGithubInfo = useCallback(
    async (url) => {
      const parsed = parseGitHubRepoUrl(url);
      if (!parsed) return;

      if (githubUsername && parsed.owner.toLowerCase() !== githubUsername.toLowerCase()) {
        setError?.(`This project must be under your GitHub account (${githubUsername}). You can only submit repos you own.`);
        return;
      }

      setFetchingGithub(true);
      try {
        const res = await fetch(`/api/projects/import-github?url=${encodeURIComponent(url)}`);
        if (!res.ok) return;
        const data = await res.json();
        const incoming = data.project || {};
        setImported(incoming);
        setForm((prev) => ({
          ...prev,
          name: prev.name || incoming.name || "",
          description: prev.description || incoming.description || incoming.readmeSummary || "",
          website: prev.website || incoming.website || "",
          tags: prev.tags || (incoming.tags || []).join(", "),
          isOpenSource: incoming.isOpenSource ?? prev.isOpenSource,
        }));
      } catch {} finally {
        setFetchingGithub(false);
      }
    },
    [githubUsername, setError, setForm],
  );

  useEffect(() => {
    const prev = lastUrlRef.current;
    lastUrlRef.current = githubUrl;
    if (githubUrl && githubUrl !== prev && githubUrl.includes("github.com/")) {
      fetchGithubInfo(githubUrl);
    }
  }, [githubUrl, fetchGithubInfo]);

  useEffect(() => {
    if (!githubUrl || !githubUrl.includes("github.com/") || isEditMode) {
      setDuplicateWarning(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const dup = await checkDuplicateGitHubUrl(githubUrl);
      if (!cancelled) setDuplicateWarning(dup);
    }, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [githubUrl, isEditMode]);

  return { fetchingGithub, imported, setImported, duplicateWarning, setDuplicateWarning };
}
