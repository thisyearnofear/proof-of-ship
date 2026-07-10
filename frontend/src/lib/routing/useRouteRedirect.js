import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Client-side redirect for legacy routes consolidated under a new path.
 * @param {string | ((router: import('next/router').NextRouter) => string) | undefined} target
 */
export default function useRouteRedirect(target) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || !target) return;
    const resolved = typeof target === "function" ? target(router) : target;
    if (resolved) router.replace(resolved);
  }, [router, router.isReady, target]);
}
