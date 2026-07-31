/**
 * DataService — reduced to caching + GitHub proxy layer.
 *
 * Project loading, search, stats, and ecosystem aggregation have been extracted
 * to ProjectDataService. Project mutations go through the authenticated API.
 *
 * This file retains the singleton pattern and re-exports for backward
 * compatibility. Consumers should migrate to the new services.
 */

import { dataService } from './DataServiceCore';

export type { CacheEntry, FetchOptions } from './DataServiceCore';
export type { ProjectStats, Project, EcosystemProjects, EcosystemStats } from './DataServiceCore';

// Re-exported singleton (backward compat with enhancedDataService and dataService consumers)
export const enhancedDataService = dataService;
export { dataService };

// Re-exported class (backward compat with type references)
export { DataService } from './DataServiceCore';

// Re-exported hook
export { useDataService } from './DataServiceCore';

// Re-exported methods (backward compat with project loading consumers)
export { loadAllProjects, getProject, searchProjects, getEcosystemStats, clearProjectCache } from './ProjectDataService';

// Re-exported caching utilities (via dataService singleton)
const { fetchWithCache, clearCache, cancelAllRequests } = dataService;
export { fetchWithCache, clearCache, cancelAllRequests };
