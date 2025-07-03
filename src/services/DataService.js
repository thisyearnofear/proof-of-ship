/**
 * Centralized data service for GitHub and Firebase operations
 * Handles caching, error recovery, and request management
 */

import { validateGitHubData, validateProject } from "@/schemas/project";
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
   * Load GitHub data for a project with intelligent caching
   */
  async loadGitHubData(
    projectSlug,
    dataTypes = ["meta", "commits"] // Default to essential data only
  ) {
    const results = {};
    const errors = {};

    await Promise.allSettled(
      dataTypes.map(async (type) => {
        try {
          // Use per-type TTL for intelligent caching
          const ttl = this.cacheTTLByType[type] ?? (5 * 60 * 1000); // 5min fallback
          
          const data = await this.fetchWithCache(
            `github-${projectSlug}-${type}`,
            async () => {
              const response = await this.fetchFromGitHub(projectSlug, type);
              return response;
            },
            {
              ttl,
              validate: (data) => validateGitHubData(data, type),
              transform: (data) => this._transformGitHubData(data, type),
            }
          );

          results[type] = data;
        } catch (error) {
          errors[type] = error.message;
          console.error(`Failed to load ${type} for ${projectSlug}:`, error);
        }
      })
    );

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

  async fetchFromGitHub(projectSlug, type) {
    const { owner, repo } = this._getRepoDetails(projectSlug);
    const endpoint = this._getGitHubEndpoint(owner, repo, type);
    const headers = {
      "Content-Type": "application/json",
    };

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      // Provide more helpful error messages
      if (response.status === 401) {
        throw new Error(`GitHub API authentication failed. Please configure GITHUB_TOKEN environment variable.`);
      } else if (response.status === 403) {
        throw new Error(`GitHub API rate limit exceeded. Please try again later.`);
      } else if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found.`);
      } else {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }

  _getRepoDetails(projectSlug) {
    const repo = repos.find((r) => r.slug === projectSlug);
    if (repo) {
      return { owner: repo.owner, repo: repo.repo };
    }
    // Fallback for safety, though this should ideally not be reached
    return { owner: "thisyearnofear", repo: "POS-dashboard" };
  }

  _getGitHubEndpoint(owner, repo, type) {
    const baseUrl = `/api/github/repos/${owner}/${repo}`;
    switch (type) {
      case "issues":
        return `${baseUrl}/issues`;
      case "prs":
        return `${baseUrl}/pulls`;
      case "commits":
        return `${baseUrl}/stats/commit_activity`;
      case "meta":
        return baseUrl;
      default:
        throw new Error(`Invalid GitHub data type: ${type}`);
    }
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
