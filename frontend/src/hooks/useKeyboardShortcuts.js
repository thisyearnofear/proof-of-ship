/**
 * Global Keyboard Shortcuts
 * Cmd+K → open search (explore page), Cmd+J → toggle AI chat, Esc → close modals
 */
import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";

export default function useKeyboardShortcuts() {
  const router = useRouter();

  const handler = useCallback(
    (e) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const tag = document.activeElement?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Cmd+K → focus search on Back Discover or navigate to Explore
      if (isMeta && e.key === "k") {
        e.preventDefault();
        if (router.pathname !== "/explore" && router.pathname !== "/back") {
          router.push("/explore");
        }
        setTimeout(() => {
          const searchInput = document.querySelector("[data-search-input]");
          if (searchInput) searchInput.focus();
        }, router.pathname === "/back" ? 0 : 100);
        return;
      }

      // Cmd+J → toggle AI chat widget
      if (isMeta && e.key === "j") {
        e.preventDefault();
        const chatToggle = document.querySelector('[data-chat-toggle]');
        if (chatToggle) chatToggle.click();
        return;
      }

      // Esc → close modals / chat (only when not in an input)
      if (e.key === "Escape" && !isInput) {
        const chatClose = document.querySelector('[data-chat-close]');
        if (chatClose) chatClose.click();
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
