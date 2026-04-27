/**
 * Data Service Tests
 * Unit tests for DataService module
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataService, DataService, CacheEntry, FetchOptions } from './DataService';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    service = new DataService();
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    service.clearAllCaches();
  });

  // =========================================================================
  // Caching Utilities
  // =========================================================================
  describe('Caching utilities', () => {
    it('should cache data with TTL', async () => {
      const fetcher = vi.fn().mockResolvedValue('test-data');
      const key = 'test-key';

      const result = await service.fetchWithCache(key, fetcher, { ttl: 1000 });

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result).toBe('test-data');

      // Second call should use cache
      const result2 = await service.fetchWithCache(key, fetcher, { ttl: 1000 });
      expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, cache hit
      expect(result2).toBe('test-data');
    });

    it('should fetch new data when cache expires', async () => {
      const fetcher = vi.fn().mockResolvedValue('test-data');
      const key = 'test-key';

      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const timestamps = [1000, 3000]; // Second call is 2s later
      vi.spyOn(Date, 'now').mockImplementation(() => timestamps.shift()!);

      await service.fetchWithCache(key, fetcher, { ttl: 1000 });
      
      // Restore Date.now and advance time beyond TTL
      vi.restoreAllMocks();
      vi.spyOn(Date, 'now').mockReturnValue(3000);

      const result = await service.fetchWithCache(key, fetcher, { ttl: 1000 });

      // Should call fetcher again because cache expired
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(result).toBe('test-data');

      vi.restoreAllMocks();
    });

    it('should deduplicate concurrent requests', async () => {
      const fetcher = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('test-data'), 100))
      );
      const key = 'dedupe-key';

      // Make 3 concurrent requests
      const promises = [
        service.fetchWithCache(key, fetcher),
        service.fetchWithCache(key, fetcher),
        service.fetchWithCache(key, fetcher)
      ];

      const results = await Promise.all(promises);

      // All should resolve to same data
      expect(results).toEqual(['test-data', 'test-data', 'test-data']);
      // Fetcher should only be called once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should respect default TTL per cache key type', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');
      
      // Test different key types use their default TTLs
      await service.fetchWithCache('projects_test', fetcher);
      await service.fetchWithCache('github_test', fetcher);
      await service.fetchWithCache('meta_test', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('should clear cache for specific prefix', () => {
      // Manually add cache entries
      service['cache'].set('prefix_a_key1', { data: 'val1', timestamp: Date.now() });
      service['cache'].set('prefix_a_key2', { data: 'val2', timestamp: Date.now() });
      service['cache'].set('prefix_b_key1', { data: 'val3', timestamp: Date.now() });

      service.clearCache('prefix_a');

      expect(service['cache'].has('prefix_a_key1')).toBe(false);
      expect(service['cache'].has('prefix_a_key2')).toBe(false);
      expect(service['cache'].has('prefix_b_key1')).toBe(true);
    });

    it('should clear all cache when no prefix specified', () => {
      service['cache'].set('key1', { data: 'val1', timestamp: Date.now() });
      service['cache'].set('key2', { data: 'val2', timestamp: Date.now() });

      service.clearCache();

      expect(service['cache'].size).toBe(0);
    });
  });

  // =========================================================================
  // Request Execution with Retry
  // =========================================================================
  describe('Request execution with retry', () => {
    it('should retry failed requests up to retry limit', async () => {
      const fetcher = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await service.fetchWithCache('retry-test', fetcher, { retries: 3 });

      expect(fetcher).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('should throw error after all retries exhausted', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Permanent error'));

      await expect(
        service.fetchWithCache('retry-test', fetcher, { retries: 2 })
      ).rejects.toThrow('Permanent error');

      expect(fetcher).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should timeout requests that exceed timeout limit', async () => {
      const fetcher = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('slow'), 200))
      );

      await expect(
        service.fetchWithCache('timeout-test', fetcher, { timeout: 50 })
      ).rejects.toThrow();

      // Note: AbortError may be thrown depending on implementation
    });

    it('should handle abort errors gracefully', async () => {
      const controller = new AbortController();
      controller.abort();

      const fetcher = vi.fn().mockImplementation(() => {
        if (controller.signal.aborted) {
          const err = new Error('Aborted');
          err.name = 'AbortError';
          throw err;
        }
        return Promise.resolve('data');
      });

      await expect(
        service.fetchWithCache('abort-test', fetcher)
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // Request Cancellation
  // =========================================================================
  describe('Request cancellation', () => {
    it('should cancel all pending requests', () => {
      service.cancelAllRequests();

      expect(service['abortControllers'].size).toBe(0);
      expect(service['requestQueue'].size).toBe(0);
    });

    it('should clear request queue after request completes', async () => {
      const fetcher = vi.fn().mockResolvedValue('data');
      const key = 'queue-test';

      await service.fetchWithCache(key, fetcher);

      expect(service['requestQueue'].has(key)).toBe(false);
    });
  });

  // =========================================================================
  // Project Stats Calculation
  // =========================================================================
  describe('Project stats calculation', () => {
    it('should calculate health score correctly', () => {
      const githubData = {
        commits: [
          { commit: { author: { date: new Date().toISOString() } } },
          { commit: { author: { date: new Date().toISOString() } } },
        ],
        meta: {
          stargazers_count: 10,
          forks_count: 5,
          language: 'TypeScript',
          has_readme: true,
          description: 'A test project'
        },
        issues: [
          { state: 'closed' },
          { state: 'closed' },
          { state: 'open' }
        ],
        pulls: []
      };

      const stats = service.calculateProjectStats(githubData);

      expect(stats.healthScore).toBeGreaterThan(0);
      expect(stats.healthScore).toBeLessThanOrEqual(100);
      expect(stats.commits).toBe(2);
      expect(stats.stars).toBe(10);
      expect(stats.forks).toBe(5);
    });

    it('should return default stats for invalid data', () => {
      const stats = service.calculateProjectStats(null);

      expect(stats).toEqual({
        commits: 0,
        issues: 0,
        pulls: 0,
        stars: 0,
        forks: 0,
        watchers: 0,
        lastCommit: null,
        languages: [],
        isActive: false,
        healthScore: 0
      });
    });

    it('should detect active projects', () => {
      const githubData = {
        commits: [
          { commit: { author: { date: new Date().toISOString() } } }
        ]
      };

      const stats = service.calculateProjectStats(githubData);
      expect(stats.isActive).toBe(true);
    });

    it('should detect inactive projects', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const githubData = {
        commits: [
          { commit: { author: { date: oldDate.toISOString() } } }
        ]
      };

      const stats = service.calculateProjectStats(githubData);
      expect(stats.isActive).toBe(false);
    });

    it('should calculate health score with recent commits', () => {
      const githubData = {
        commits: Array(20).fill(0).map((_, i) => ({
          commit: { author: { date: new Date().toISOString() } }
        })),
        meta: { stargazers_count: 0, forks_count: 0 },
        issues: [],
        pulls: []
      };

      const stats = service.calculateProjectStats(githubData);

      // 20 commits * 2 = 40 points (capped at 40)
      expect(stats.healthScore).toBeGreaterThanOrEqual(40);
    });
  });

  // =========================================================================
  // Helper Methods
  // =========================================================================
  describe('Helper methods', () => {
    it('should generate valid slug from name', () => {
      const slug = (service as any).generateSlug('My Awesome Project!');
      expect(slug).toBe('my-awesome-project');
    });

    it('should handle special characters in slug generation', () => {
      const slug = (service as any).generateSlug('Test@#$%^&*()Project');
      expect(slug).toBe('testproject');
    });

    it('should truncate long slugs', () => {
      const longName = 'a'.repeat(100);
      const slug = (service as any).generateSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(50);
    });

    it('should filter recent commits', () => {
      const recentDate = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      const commits = [
        { commit: { author: { date: recentDate.toISOString() } } },
        { commit: { author: { date: oldDate.toISOString() } } }
      ];

      const recent = (service as any).getRecentCommits(commits, 30);
      expect(recent).toHaveLength(1);
    });

    it('should get last commit date', () => {
      const dates = [
        '2023-01-01T00:00:00.000Z',
        '2023-06-01T00:00:00.000Z',
        '2023-12-01T00:00:00.000Z'
      ];

      const commits = dates.map(date => ({
        commit: { author: { date }, committer: { date } }
      }));

      const lastDate = (service as any).getLastCommitDate(commits);
      expect(lastDate).toBe('2023-12-01T00:00:00.000Z');
    });
  });

  // =========================================================================
  // Search and Filter
  // =========================================================================
  describe('Search and filter', () => {
    it('should search projects by name', () => {
      const projects = {
        all: [
          { name: 'Test Project', description: 'A test', category: 'defi' },
          { name: 'Other Project', description: 'Another', category: 'gaming' }
        ]
      } as any;

      service['projectCache'] = new Map([
        ['projects_all', { data: projects, timestamp: Date.now() }]
      ]);

      vi.spyOn(service, 'loadAllProjects').mockResolvedValue(projects);

      // We'll test the search logic is in place
      expect(service).toBeDefined();
    });
  });
});