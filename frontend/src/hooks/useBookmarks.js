/**
 * useBookmarks — simple hook for project bookmark management
 * Persists to localStorage for offline-first, no-auth browsing.
 * Can be upgraded to Firestore sync later.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pos-project-bookmarks';

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBookmarks(loadBookmarks());
    setLoaded(true);
  }, []);

  const isBookmarked = useCallback(
    (slug) => bookmarks.includes(slug),
    [bookmarks]
  );

  const toggleBookmark = useCallback((slug) => {
    setBookmarks((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      saveBookmarks(next);
      return next;
    });
  }, []);

  const addBookmark = useCallback((slug) => {
    setBookmarks((prev) => {
      if (prev.includes(slug)) return prev;
      const next = [...prev, slug];
      saveBookmarks(next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((slug) => {
    setBookmarks((prev) => {
      const next = prev.filter((s) => s !== slug);
      saveBookmarks(next);
      return next;
    });
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    saveBookmarks([]);
  }, []);

  return {
    bookmarks,
    loaded,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearBookmarks,
  };
}
