/**
 * Centralized data service for GitHub and Firebase operations
 * Reads GitHub data from Firestore cache (populated by scripts/sync-github.js)
 * No runtime GitHub API calls - eliminates rate limit issues
 */

import { validateGitHubData, validateProject } from "@/schemas/project";
import { db } from "../lib/firebase/clientApp";
import { doc, getDoc, DocumentData } from "firebase/firestore";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface FetchOptions<T> {
  ttl?: number;
  validate?: (data: any) => boolean;
  transform?: (data: any) => T;
  retries?: number;
  timeout?: number;
}

class DataService {
  private cache: Map<string, CacheEntry<any>>;
  private abortControllers: Map<string, AbortController>;
  private requestQueue: Map<string, Promise<any>>;
  private cacheTTLByType: Record<string, number>;
  private cacheTTL: Record<string, number>;

  constructor() {
    this.cache = new Map();
    this.abortControllers = new Map();
    this.requestQueue = new Map();

    this.cacheTTLByType = {
      meta: 24 * 60 * 60 * 1000,
      commits: 24 * 60 * 60 * 1000,
      issues: 60 * 60 * 1000,
      prs: 60 * 60 * 1000,
    };
    
    this.cacheTTL = {
      contracts: 60 * 1000,
      projects: 10 * 60 * 1000,
      github: 60 * 60 * 1000
    };
  }

  async fetchWithCache<T>(
    key: string, 
    fetcher: (signal: AbortSignal) => Promise<T>, 
    options: FetchOptions<T> = {}
  ): Promise<T> {
    const {
      ttl = this.cacheTTL.github,
      validate = null,
      transform = null,
      retries = 3,
      timeout = 30000,
    } = options;

    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key)!;
      if (Date.now() - timestamp < ttl) {
        return data;
      }
    }

    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const requestPromise = this._executeRequest(key, fetcher, {
      validate,
      transform,
      retries,
      timeout,
    });
    this.requestQueue.set(key, requestPromise);

    try {
      const data = await requestPromise;
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.requestQueue.delete(key);
    }
  }

  private async _executeRequest<T>(
    key: string,
    fetcher: (signal: AbortSignal) => Promise<T>,
    options: FetchOptions<T>
  ): Promise<T> {
    const { retries = 3, timeout = 30000, transform } = options;
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        this.abortControllers.set(`${key}-${attempt}`, controller);

        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          let data = await fetcher(controller.signal);
          if (transform) {
            data = transform(data);
          }
          clearTimeout(timeoutId);
          return data;
        } finally {
          this.abortControllers.delete(`${key}-${attempt}`);
        }
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          console.warn(`Request ${key} timed out (attempt ${attempt + 1})`);
        } else {
          console.error(`Request ${key} failed (attempt ${attempt + 1}):`, err);
        }
      }
    }
    throw lastError;
  }
}

export default DataService;
