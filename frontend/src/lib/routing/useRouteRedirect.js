import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Client-side redirect for legacy routes consolidated under a new path.
 * @param {string} target
 */
export default function useRouteRedirect(target) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(target);
  }, [router, router.isReady, target]);
}
