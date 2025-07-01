import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useDataService } from "@/services/DataService";
import repos from "../../../repos.json";

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
  const [errors, setErrors] = useState({});
  // Set "stablestation" as the default selected project
  const [selectedSlug, setSelectedSlug] = useState("stablestation");
  
  const dataService = useDataService();
  const mountedRef = useRef(true);

  // Fetch all JSON files using the data service
  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const results = await dataService.loadAllGitHubData(repos);
        
        if (mountedRef.current) {
          setDataMap(results);
          setErrors(
            Object.fromEntries(
              Object.entries(results)
                .filter(([_, data]) => data.hasErrors)
                .map(([slug, data]) => [slug, data.errors || data.error])
            )
          );
          setLoading(false);
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error('Failed to load GitHub data:', error);
          setErrors({ global: error.message });
          setLoading(false);
        }
      }
    }

    fetchAll();

    return () => {
      mountedRef.current = false;
      dataService.cancelAllRequests();
    };
  }, [dataService]);

  const current = dataMap[selectedSlug] || emptyData;
  const issues = current.issues.filter((issue) => !issue.pull_request);
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
    loading,
    errors,
    // Utility functions
    refreshData: () => {
      dataService.clearCache('github-');
      // Trigger re-fetch by clearing cache
    },
    hasErrors: Object.keys(errors).length > 0,
  };

  return (
    <GithubContext.Provider value={value}>
      {loading ? (
        <div className="p-8 text-center text-gray-400">
          Loading project data…
        </div>
      ) : (
        children
      )}
    </GithubContext.Provider>
  );
}

export function useGithub() {
  const context = useContext(GithubContext);
  if (context === undefined) {
    throw new Error("useGithub must be used within a GithubProvider");
  }
  return context;
}
