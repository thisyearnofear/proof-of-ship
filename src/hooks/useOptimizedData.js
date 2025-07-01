/**
 * Performance-optimized data hooks with memoization and lazy loading
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useGithub } from '@/providers/Github/Github';

/**
 * Optimized hook for GitHub issues with filtering and memoization
 */
export const useOptimizedIssues = (filters = {}) => {
  const { issues, loading, errors } = useGithub();
  
  const filteredIssues = useMemo(() => {
    if (!Array.isArray(issues)) return [];
    
    let filtered = issues;
    
    // Apply state filter
    if (filters.state) {
      filtered = filtered.filter(issue => issue.state === filters.state);
    }
    
    // Apply label filter
    if (filters.label) {
      filtered = filtered.filter(issue => 
        issue.labels?.some(label => label.name === filters.label)
      );
    }
    
    // Apply assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(issue => 
        issue.assignee?.login === filters.assignee ||
        issue.assignees?.some(assignee => assignee.login === filters.assignee)
      );
    }
    
    // Apply author filter
    if (filters.author) {
      filtered = filtered.filter(issue => issue.user?.login === filters.author);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title.toLowerCase().includes(searchLower) ||
        issue.body?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(issue => {
        const issueDate = new Date(issue.created_at);
        if (filters.dateFrom && issueDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && issueDate > new Date(filters.dateTo)) return false;
        return true;
      });
    }
    
    return filtered;
  }, [issues, filters]);
  
  // Memoized statistics
  const stats = useMemo(() => {
    if (!Array.isArray(issues)) return {};
    
    const open = issues.filter(issue => issue.state === 'open').length;
    const closed = issues.filter(issue => issue.state === 'closed').length;
    
    const labelCounts = {};
    const authorCounts = {};
    const assigneeCounts = {};
    
    issues.forEach(issue => {
      // Count labels
      issue.labels?.forEach(label => {
        labelCounts[label.name] = (labelCounts[label.name] || 0) + 1;
      });
      
      // Count authors
      if (issue.user?.login) {
        authorCounts[issue.user.login] = (authorCounts[issue.user.login] || 0) + 1;
      }
      
      // Count assignees
      issue.assignees?.forEach(assignee => {
        assigneeCounts[assignee.login] = (assigneeCounts[assignee.login] || 0) + 1;
      });
    });
    
    return {
      total: issues.length,
      open,
      closed,
      filtered: filteredIssues.length,
      topLabels: Object.entries(labelCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topAuthors: Object.entries(authorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      topAssignees: Object.entries(assigneeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }, [issues, filteredIssues.length]);
  
  return {
    issues: filteredIssues,
    stats,
    loading,
    errors,
    hasData: filteredIssues.length > 0
  };
};

/**
 * Optimized hook for pull requests
 */
export const useOptimizedPRs = (filters = {}) => {
  const { prs, loading, errors } = useGithub();
  
  const filteredPRs = useMemo(() => {
    if (!Array.isArray(prs)) return [];
    
    let filtered = prs;
    
    // Apply state filter
    if (filters.state) {
      filtered = filtered.filter(pr => pr.state === filters.state);
    }
    
    // Apply merged filter
    if (filters.merged !== undefined) {
      filtered = filtered.filter(pr => !!pr.merged_at === filters.merged);
    }
    
    // Apply author filter
    if (filters.author) {
      filtered = filtered.filter(pr => pr.user?.login === filters.author);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(pr => 
        pr.title.toLowerCase().includes(searchLower) ||
        pr.body?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [prs, filters]);
  
  const stats = useMemo(() => {
    if (!Array.isArray(prs)) return {};
    
    const open = prs.filter(pr => pr.state === 'open').length;
    const closed = prs.filter(pr => pr.state === 'closed').length;
    const merged = prs.filter(pr => pr.merged_at).length;
    
    return {
      total: prs.length,
      open,
      closed,
      merged,
      filtered: filteredPRs.length
    };
  }, [prs, filteredPRs.length]);
  
  return {
    prs: filteredPRs,
    stats,
    loading,
    errors,
    hasData: filteredPRs.length > 0
  };
};

/**
 * Lazy loading hook for large datasets
 */
export const usePaginatedData = (data, pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState(new Set([1]));
  
  const paginatedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    const maxPage = Math.min(currentPage, Math.ceil(data.length / pageSize));
    const endIndex = maxPage * pageSize;
    
    return data.slice(0, endIndex);
  }, [data, currentPage, pageSize]);
  
  const loadMore = useCallback(() => {
    const totalPages = Math.ceil(data.length / pageSize);
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setLoadedPages(prev => new Set([...prev, nextPage]));
    }
  }, [currentPage, data.length, pageSize]);
  
  const hasMore = useMemo(() => {
    return currentPage < Math.ceil(data.length / pageSize);
  }, [currentPage, data.length, pageSize]);
  
  const reset = useCallback(() => {
    setCurrentPage(1);
    setLoadedPages(new Set([1]));
  }, []);
  
  return {
    data: paginatedData,
    currentPage,
    hasMore,
    loadMore,
    reset,
    totalPages: Math.ceil(data.length / pageSize),
    totalItems: data.length,
    loadedItems: paginatedData.length
  };
};

/**
 * Debounced search hook
 */
export const useDebouncedSearch = (initialValue = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState(initialValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedTerm('');
  }, []);
  
  return {
    searchTerm,
    debouncedTerm,
    setSearchTerm,
    clearSearch,
    isSearching: searchTerm !== debouncedTerm
  };
};

/**
 * Memoized chart data hook
 */
export const useChartData = (commits) => {
  return useMemo(() => {
    if (!Array.isArray(commits)) return { labels: [], datasets: [] };
    
    // Sort commits by week
    const sortedCommits = [...commits].sort((a, b) => a.week - b.week);
    
    const labels = sortedCommits.map(commit => {
      const date = new Date(commit.week * 1000);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = sortedCommits.map(commit => commit.total);
    
    return {
      labels,
      datasets: [{
        label: 'Commits',
        data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true
      }]
    };
  }, [commits]);
};

/**
 * Local storage hook with performance optimization
 */
export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  
  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);
  
  return [value, setStoredValue];
};
