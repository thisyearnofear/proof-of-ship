/**
 * ProjectDataService
 *
 * Handles project loading (Firestore), GitHub data enrichment, stats
 * calculation, search, and ecosystem stats.
 *
 * Extracted from DataService.ts for separation of concerns.
 */

import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import type { ProjectStats, Project, EcosystemProjects, EcosystemStats } from './DataService';
import { dataService } from './DataService';

// ========================================================================
// Project Loading
// ========================================================================

const projectCache: Map<string, { data: EcosystemProjects; timestamp: number }> = new Map();

export async function loadAllProjects(
  ecosystem = 'all',
  options: { celoDataTypes?: string[]; baseDataTypes?: string[]; forceRefresh?: boolean } = {}
): Promise<EcosystemProjects> {
  const {
    celoDataTypes = ['meta', 'commits'],
    baseDataTypes = ['meta', 'commits'],
    forceRefresh = false,
  } = options;

  const cacheKey = `projects_${ecosystem}_${celoDataTypes.join(',')}_${baseDataTypes.join(',')}`;
  const CACHE_TTL = 10 * 60 * 1000;

  if (!forceRefresh && projectCache.has(cacheKey)) {
    const { data, timestamp } = projectCache.get(cacheKey)!;
    if (Date.now() - timestamp < CACHE_TTL) return data;
  }

  const projects: EcosystemProjects = {
    celo: [], arc: [], base: [], linea: [], arbitrum: [],
    ethereum: [], optimism: [], solana: [],
  };

  const ecosystems = ecosystem === 'all'
    ? ['celo', 'arc', 'base', 'linea', 'arbitrum', 'ethereum', 'optimism', 'solana']
    : [ecosystem];

  const seenSlugs = new Set<string>();

  try {
    const ref = collection(db, 'projects');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    await Promise.all(snapshot.docs.map(async (docSnap) => {
      const docData = docSnap.data();
      const projectEcosystem = docData.ecosystem || 'base';
      if (!ecosystems.includes(projectEcosystem)) return;

      const projectData: Project = {
        id: docSnap.id,
        slug: docData.slug || '',
        name: docData.name || '',
        owner: docData.owner || '',
        repo: docData.repo || '',
        ecosystem: projectEcosystem,
        ...docData,
      } as Project;

      if (projectData.owner && projectData.repo) {
        try {
          const githubData = await dataService.fetchGitHubDataForProject(
            projectData.owner,
            projectData.repo,
            projectEcosystem === 'celo' ? celoDataTypes : baseDataTypes
          );
          projectData.githubData = githubData;
          projectData.stats = dataService.calculateProjectStats(githubData);
        } catch {
          projectData.githubData = {};
          projectData.stats = getDefaultStats();
        }
      }

      if (!seenSlugs.has(projectData.slug)) {
        seenSlugs.add(projectData.slug);
        projects[projectEcosystem as keyof EcosystemProjects].push(projectData);
      }
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
  }

  projectCache.set(cacheKey, { data: projects, timestamp: Date.now() });
  return projects;
}

export function clearProjectCache(): void {
  projectCache.clear();
}

// ========================================================================
// Single Project
// ========================================================================

export async function getProject(slug: string, ecosystem: string | null = null): Promise<Project | null> {
  const dataTypes = ['meta', 'commits', 'issues', 'prs'];

  try {
    const ref = doc(db, 'projects', slug);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const snapData = snap.data();
    const projectData: Project = {
      id: snap.id,
      slug: snapData.slug || slug,
      name: snapData.name || '',
      owner: snapData.owner || '',
      repo: snapData.repo || '',
      ecosystem: ecosystem || snapData.ecosystem || 'base',
      ...snapData,
    } as Project;

    if (projectData.owner && projectData.repo) {
      const githubData = await dataService.fetchGitHubDataForProject(projectData.owner, projectData.repo, dataTypes);
      projectData.githubData = githubData;
      projectData.stats = dataService.calculateProjectStats(githubData);
    }
    return projectData;
  } catch (error) {
    console.error(`Failed to load project ${slug}:`, error);
    return null;
  }
}

// ========================================================================
// Search
// ========================================================================

export async function searchProjects(query: string, ecosystem = 'all'): Promise<Project[]> {
  const allProjects = await loadAllProjects(ecosystem);
  const searchTerm = query.toLowerCase();
  const results: Project[] = [];

  Object.values(allProjects).forEach((projects) => {
    const filtered = projects.filter((project: Project) =>
      project.name?.toLowerCase().includes(searchTerm) ||
      project.slug?.toLowerCase().includes(searchTerm) ||
      project.description?.toLowerCase().includes(searchTerm) ||
      project.owner?.toLowerCase().includes(searchTerm)
    );
    results.push(...filtered);
  });

  return results;
}

// ========================================================================
// Stats
// ========================================================================

export async function getEcosystemStats(ecosystem = 'all'): Promise<Record<string, EcosystemStats>> {
  const projects = await loadAllProjects(ecosystem);
  const stats: Record<string, EcosystemStats> = {};

  Object.entries(projects).forEach(([eco, projectList]) => {
    stats[eco] = {
      totalProjects: projectList.length,
      activeProjects: projectList.filter((p: Project) => p.stats?.isActive).length,
      totalCommits: projectList.reduce((sum: number, p: Project) => sum + (p.stats?.commits || 0), 0),
      totalStars: projectList.reduce((sum: number, p: Project) => sum + (p.stats?.stars || 0), 0),
      averageHealthScore: projectList.length > 0
        ? Math.round(projectList.reduce((sum: number, p: Project) => sum + (p.stats?.healthScore || 0), 0) / projectList.length)
        : 0,
      lastUpdated: new Date().toISOString(),
    };
  });

  return ecosystem === 'all' ? stats : { [ecosystem]: stats[ecosystem] } as Record<string, EcosystemStats>;
}

// ========================================================================
// Helpers
// ========================================================================

export function getDefaultStats(): ProjectStats {
  return {
    commits: 0,
    issues: 0,
    pulls: 0,
    stars: 0,
    forks: 0,
    watchers: 0,
    lastCommit: null,
    languages: [],
    isActive: false,
    healthScore: 0,
  };
}
