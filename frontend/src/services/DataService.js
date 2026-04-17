/**
 * Centralized data service for GitHub and Firebase operations
 * Reads GitHub data from Firestore cache (populated by scripts/sync-github.js)
 * No runtime GitHub API calls - eliminates rate limit issues
 */

import { validateGitHubData, validateProject } from "@/schemas/project";
import { db } from "../lib/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import repos from "../../repos.json";

class DataService {
  constructor() {
    this.cache = new Map();
    this.abortControllers = new Map();
    this.requestQueue = new Map();

    // Cache TTL settings - per-endpoint optimization
    this.cacheTTLByType = {
      meta: 24 * 60 * 60 * 1000, // 24 hours - repo metadata changes slowly
      commits: 24 * 60 * 60 * 1000, // 24 hours - commit activity is historical
      issues: 60 * 60 * 1000, // 1 hour - more dynamic but not real-time critical
      prs: 60 * 60 * 1000, // 1 hour - similar to issues
    };
    
    // Fallback TTL for non-GitHub resources
    this.cacheTTL = {
      contracts: 60 * 1000, // 1 minute
      projects: 10 * 60 * 1000, // 10 minutes
    };
  }

  /**
   * Generic fetch with caching, deduplication, and error handling
   */
  async fetchWithCache(key, fetcher, options = {}) {
    const {
      ttl = this.cacheTTL.github,
      validate = null,
      transform = null,
      retries = 3,
      timeout = 30000,
    } = options;

    // Check cache first
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < ttl) {
        return data;
      }
    }

    // Check if request is already in progress (deduplication)
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    // Create new request promise
    const requestPromise = this._executeRequest(key, fetcher, {
      validate,
      transform,
      retries,
      timeout,
    });
    this.requestQueue.set(key, requestPromise);

    try {
      const data = await requestPromise;

      // Cache successful result
      this.cache.set(key, { data, timestamp: Date.now() });

      return data;
    } finally {
      // Clean up request queue
      this.requestQueue.delete(key);
    }
  }

  async _executeRequest(
    key,
    fetcher,
    { validate, transform, retries, timeout }
  ) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for this attempt
        const controller = new AbortController();
        this.abortControllers.set(`${key}-${attempt}`, controller);

        // Set timeout
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          let data = await fetcher(controller.signal);

          // Transform data if transformer provided
          if (transform) {
            data = transform(data);
          }

          // Validate data if validator provided
          if (validate) {
            const validation = validate(data);
            if (!validation.isValid) {
              throw new Error(
                `Data validation failed: ${validation.errors.join(", ")}`
              );
            }
          }

          clearTimeout(timeoutId);
          this.abortControllers.delete(`${key}-${attempt}`);

          return data;
        } catch (error) {
          clearTimeout(timeoutId);
          this.abortControllers.delete(`${key}-${attempt}`);

          if (error.name === "AbortError") {
            throw new Error(`Request timeout after ${timeout}ms`);
          }
          throw error;
        }
      } catch (error) {
        lastError = error;

        // Don't retry on validation errors or timeouts
        if (
          error.message.includes("validation failed") ||
          error.message.includes("timeout")
        ) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await this._wait(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError;
  }

  /**
   * Load GitHub data for a project from Firestore cache
   * Data is populated by scripts/sync-github.js - no runtime GitHub API calls
   */
  async loadGitHubData(
    projectSlug,
    dataTypes = ["meta", "commits"] // Default to essential data only
  ) {
    const results = {};
    const errors = {};

    try {
      const { owner, repo } = this._getRepoDetails(projectSlug);
      const cacheKey = `${owner}_${repo}`;
      
      // Check memory cache first
      const memoryCacheKey = `github-cache-${cacheKey}`;
      if (this.cache.has(memoryCacheKey)) {
        const { data, timestamp } = this.cache.get(memoryCacheKey);
        if (Date.now() - timestamp < this.cacheTTL.projects) {
          return this._extractDataTypes(data, dataTypes);
        }
      }

      // Read from Firestore cache
      const cacheDoc = await getDoc(doc(db, "github_cache", cacheKey));
      
      if (!cacheDoc.exists()) {
        errors.cache = `No cached data for ${owner}/${repo}. Run: node scripts/sync-github.js`;
        return { data: results, errors };
      }

      const cachedData = cacheDoc.data();
      
      // Store in memory cache
      this.cache.set(memoryCacheKey, { data: cachedData, timestamp: Date.now() });
      
      return this._extractDataTypes(cachedData, dataTypes);
      
    } catch (error) {
      errors.fetch = error.message;
      console.error(`Failed to load GitHub data for ${projectSlug}:`, error);
      return { data: results, errors };
    }
  }

  /**
   * Extract requested data types from cached document
   */
  _extractDataTypes(cachedData, dataTypes) {
    const results = {};
    const errors = {};

    for (const type of dataTypes) {
      if (type === "meta" && cachedData.meta) {
        results.meta = cachedData.meta;
      } else if (type === "commits" && cachedData.commits) {
        results.commits = cachedData.commits;
      } else if (type === "stats" && cachedData.stats) {
        results.stats = cachedData.stats;
      } else if (type === "issues") {
        // Issues not cached - would need separate sync
        results.issues = [];
      } else if (type === "prs") {
        // PRs not cached - would need separate sync
        results.prs = [];
      }
    }

    return { data: results, errors };
  }

  /**
   * Load multiple projects' GitHub data with configurable data types
   */
  async loadAllGitHubData(projects, dataTypes = ["meta", "commits"]) {
    const results = {};

    await Promise.allSettled(
      projects.map(async (project) => {
        try {
          const { data, errors } = await this.loadGitHubData(project.slug, dataTypes);
          results[project.slug] = {
            ...data,
            project,
            hasErrors: Object.keys(errors).length > 0,
            errors,
          };
        } catch (error) {
          results[project.slug] = {
            project,
            error: error.message,
            hasErrors: true,
          };
        }
      })
    );

    return results;
  }

  /**
   * Transform GitHub data to consistent format
   */
  _transformGitHubData(data, type) {
    switch (type) {
      case "issues":
      case "prs":
        return Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              created_at: new Date(item.created_at),
              updated_at: new Date(item.updated_at),
              closed_at: item.closed_at ? new Date(item.closed_at) : null,
            }))
          : [];

      case "commits":
        return Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              week: new Date(item.week * 1000), // Convert Unix timestamp
            }))
          : [];

      case "meta":
        return {
          ...data,
          updatedAt: new Date(data.updatedAt),
        };

      default:
        return data;
    }
  }

  _getRepoDetails(projectSlug) {
    const repo = repos.find((r) => r.slug === projectSlug);
    if (repo) {
      return { owner: repo.owner, repo: repo.repo };
    }
    return { owner: "unknown", repo: "unknown" };
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => {
      try {
        controller.abort();
      } catch (error) {
        // Ignore abort errors
      }
    });
    this.abortControllers.clear();
    this.requestQueue.clear();
  }

  /**
   * Clear cache
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingRequests: this.requestQueue.size,
      activeControllers: this.abortControllers.size,
    };
  }

  _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup method for component unmount
   */
  destroy() {
    this.cancelAllRequests();
    this.clearCache();
  }
}

// Singleton instance
export const dataService = new DataService();

// React hook for using the data service
import { useEffect } from "react";

import { useMemo } from "react";

export const useDataService = () => {
  const service = useMemo(() => new DataService(), []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      service.destroy();
    };
  }, [service]);

  return service;
};

export default DataService;
