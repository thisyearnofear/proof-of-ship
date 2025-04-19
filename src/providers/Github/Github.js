import React, { createContext, useContext, useState } from 'react';
import repos from '../../../repos.json';

// Load all repo JSON data from /data/github-data at runtime
const emptyData = { issues: [], prs: [], releases: [], meta: {}, commits: [] };
const initialData = repos.reduce((acc, { slug }) => {
  acc[slug] = emptyData;
  return acc;
}, {});

const GithubContext = createContext({});

export function GithubProvider({ children }) {
  const [dataMap, setDataMap] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(repos[0]?.slug);

  // Fetch all JSON files from public/data/github-data
  React.useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const all = {};
      for (const { slug } of repos) {
        try {
          const [issues, prs, releases, meta, commits] = await Promise.all([
            fetch(`/data/github-data/${slug}-issues.json`).then(r => r.json()).catch(() => []),
            fetch(`/data/github-data/${slug}-prs.json`).then(r => r.json()).catch(() => []),
            fetch(`/data/github-data/${slug}-releases.json`).then(r => r.json()).catch(() => []),
            fetch(`/data/github-data/${slug}-meta.json`).then(r => r.json()).catch(() => ({})),
            fetch(`/data/github-data/${slug}-commits.json`).then(r => r.json()).catch(() => [])
          ]);
          all[slug] = { issues, prs, releases, meta, commits };
        } catch {
          all[slug] = emptyData;
        }
      }
      if (!cancelled) {
        setDataMap(all);
        setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const current = dataMap[selectedSlug] || emptyData;
  const issues = current.issues.filter(issue => !issue.pull_request);
  const prs = current.prs;
  const releases = current.releases;
  const meta = current.meta;
  const commits = current.commits;

  const value = {
    repos,
    selectedSlug,
    setSelectedSlug,
    issues,
    prs,
    releases,
    meta,
    commits,
    dataMap,
    setDataMap,
    loading
  };

  return (
    <GithubContext.Provider value={value}>
      {loading ? <div className="p-8 text-center text-gray-400">Loading project data…</div> : children}
    </GithubContext.Provider>
  );
}

export function useGithub() {
  const context = useContext(GithubContext);
  if (context === undefined) {
    throw new Error('useGithub must be used within a GithubProvider');
  }
  return context;
}
