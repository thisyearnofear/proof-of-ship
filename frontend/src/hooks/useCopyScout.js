/**
 * useCopyScout — encapsulates the "Copy Scout" subscription flow.
 *
 * On mount, fetches current subscription status for the user.
 * Exposes subscribe() to opt in; tracks loading + modal state locally.
 */
import { useState, useEffect, useCallback } from "react";
import { trackEvent } from "@/lib/analytics";

export default function useCopyScout(currentUser) {
  const [subscribed, setSubscribed] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/agent/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", userId: currentUser.uid }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSubscribed(Boolean(data.subscribed));
          setStatus(data.status);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const openModal = useCallback(() => {
    trackEvent("copy_scout_clicked", { user: currentUser?.uid || "anonymous" });
    setModalOpen(true);
  }, [currentUser]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const subscribe = useCallback(async () => {
    if (!currentUser) {
      alert("Please sign in to copy the Scout.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/agent/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", userId: currentUser.uid }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
        setStatus("active");
        trackEvent("copy_scout_subscribed", { user: currentUser.uid });
      }
    } catch (e) {
      console.error("Subscribe failed:", e);
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  }, [currentUser]);

  return { subscribed, status, loading, modalOpen, openModal, closeModal, subscribe };
}
