/**
 * useProjectDraft — local + cloud draft persistence for ProjectEditor.
 *
 * Three behaviors:
 *   1. localStorage write every 1s (instant fallback)
 *   2. debounced Firestore write every 8s (cross-device recovery)
 *   3. on-mount cloud fetch, restored into `form` if local is empty
 *
 * Returns draft-related state + a `clearDraft` action.
 */

import { useEffect, useState } from "react";

const DRAFT_KEY = "project-editor-draft";

export function loadLocalDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export function useProjectDraft({ form, imageUrl, isEditMode, currentUser, projectSlug }) {
  const [hasDraft, setHasDraft] = useState(Boolean(loadLocalDraft()));
  const [draftSaved, setDraftSaved] = useState(null);
  const [lastCloudSave, setLastCloudSave] = useState(null);

  useEffect(() => {
    if (isEditMode) return;
    const localTimer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, imageUrl }));
        setHasDraft(true);
        setDraftSaved("local");
      } catch {}
    }, 1000);
    return () => clearTimeout(localTimer);
  }, [form, imageUrl, isEditMode]);

  useEffect(() => {
    if (isEditMode || !currentUser?.uid) return;
    const cloudTimer = setTimeout(async () => {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "drafts", currentUser.uid), {
          form,
          updatedAt: new Date().toISOString(),
          projectId: projectSlug || null,
        }, { merge: true });
        setDraftSaved("cloud");
        setLastCloudSave(new Date());
      } catch (e) {
        console.warn("Cloud draft save failed:", e);
      }
    }, 8000);
    return () => clearTimeout(cloudTimer);
  }, [form, isEditMode, currentUser?.uid, projectSlug]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setHasDraft(false);
    setDraftSaved(null);
    if (currentUser?.uid) {
      import("@/lib/firebase/clientApp").then(({ db }) => {
        import("firebase/firestore").then(({ doc, deleteDoc }) => {
          deleteDoc(doc(db, "drafts", currentUser.uid)).catch(() => {});
        });
      });
    }
  };

  return { hasDraft, draftSaved, lastCloudSave, setHasDraft, setDraftSaved, clearDraft };
}

/**
 * useCloudDraftRestore — fetches the user's cloud draft on mount (if any)
 * and lets the caller apply it. Returns the raw cloud data so the editor
 * can decide when to merge it.
 */
export function useCloudDraftRestore({ isEditMode, currentUser, hasLocalDraft }) {
  const [cloudDraft, setCloudDraft] = useState(null);

  useEffect(() => {
    if (isEditMode || !currentUser?.uid || hasLocalDraft) return;
    let cancelled = false;
    async function load() {
      try {
        const { db } = await import("@/lib/firebase/clientApp");
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "drafts", currentUser.uid));
        if (!cancelled && snap.exists && !isEditMode) {
          setCloudDraft(snap.data()?.form || null);
        }
      } catch (e) {
        console.warn("Cloud draft load failed:", e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [currentUser?.uid, isEditMode, hasLocalDraft]);

  return cloudDraft;
}
