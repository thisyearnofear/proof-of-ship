import { createContext, useContext, useState } from 'react';
import repos from '../../../repos.json';

// Initialize map of slug → data from JSON files
const initialData = repos.reduce((acc, { slug }) => {
  acc[slug] = {
    issues: require(`../../../data/github-data/${slug}-issues.json`),
    prs: require(`../../../data/github-data/${slug}-prs.json`),
    releases: require(`../../../data/github-data/${slug}-releases.json`),
    meta: require(`../../../data/github-data/${slug}-meta.json`),
    commits: require(`../../../data/github-data/${slug}-commits.json`)
  };
  return acc;
}, {});

const GithubContext = createContext({});

export function GithubProvider({ children }) {
  // dataMap: slug → { issues, prs, releases, meta }
  const [dataMap, setDataMap] = useState(initialData);
  // Currently selected project slug
  const [selectedSlug, setSelectedSlug] = useState(repos[0]?.slug);

  const current = dataMap[selectedSlug] || { issues: [], prs: [], releases: [], meta: {}, commits: [] };
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
    setDataMap
  };

  return (
    <GithubContext.Provider value={value}>
      {children}
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
