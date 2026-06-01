/**
 * useAnalyzeProjects — loads the top 50 projects from the projects
 * Firestore collection (filtered to supported ecosystems with
 * meaningful descriptions) and exposes a search-aware filtered list.
 */
import { useEffect, useState, useMemo } from "react";

const SUPPORTED_ECOSYSTEMS = ["solana", "celo", "arc", "base"];
const MIN_DESCRIPTION_LENGTH = 15;
const PROJECT_LIMIT = 50;

export default function useAnalyzeProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { collection, getDocs, query, limit: fbLimit } = await import("firebase/firestore");

        const ref = collection(db, "projects");
        const snap = await getDocs(query(ref, fbLimit(PROJECT_LIMIT)));
        if (cancelled) return;

        const all = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => {
            const eco = p.ecosystem || "";
            return SUPPORTED_ECOSYSTEMS.includes(eco) && (p.description || "").length > MIN_DESCRIPTION_LENGTH;
          });

        setProjects(all);
      } catch (err) {
        console.warn("Failed to load projects:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProjects();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.ecosystem?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  return { projects, filtered, loading, searchQuery, setSearchQuery };
}
