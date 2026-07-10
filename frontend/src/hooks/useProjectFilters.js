/**
 * useProjectFilters — shared search/filter/sort state for backer project lists.
 */

import { useMemo, useState, useCallback } from "react";
import {
  filterBackerProjects,
  sortBackerProjects,
  prioritizeScoutProjects,
} from "@/utils/projectUtils";

/**
 * @param {object[]} projects
 * @param {{ limit?: number | null, scoutProjects?: object[] }} [options]
 */
export default function useProjectFilters(projects, options = {}) {
  const { limit = null, scoutProjects } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterEcosystem, setFilterEcosystem] = useState("all");
  const [filterMultiplier, setFilterMultiplier] = useState("all");
  const [sortBy, setSortBy] = useState("health");

  const sortedMatches = useMemo(() => {
    const filtered = filterBackerProjects(projects, {
      search: searchQuery,
      ecosystem: filterEcosystem,
      minMultiplier: filterMultiplier,
    });
    const sorted = sortBackerProjects(filtered, sortBy);
    return prioritizeScoutProjects(sorted, scoutProjects);
  }, [projects, searchQuery, filterEcosystem, filterMultiplier, sortBy, scoutProjects]);

  const totalMatches = sortedMatches.length;

  const filteredProjects = useMemo(() => {
    if (limit == null || limit <= 0) return sortedMatches;
    return sortedMatches.slice(0, limit);
  }, [sortedMatches, limit]);

  const hasActiveFilters = searchQuery.trim().length > 0
    || filterEcosystem !== "all"
    || filterMultiplier !== "all";

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterEcosystem("all");
    setFilterMultiplier("all");
  }, []);

  return {
    filteredProjects,
    totalMatches,
    searchQuery,
    setSearchQuery,
    filterEcosystem,
    setFilterEcosystem,
    filterMultiplier,
    setFilterMultiplier,
    sortBy,
    setSortBy,
    hasActiveFilters,
    clearFilters,
  };
}
