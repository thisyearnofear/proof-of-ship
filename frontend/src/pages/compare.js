/**
 * /compare — redirects to the Agents tab on /back.
 */

import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { agentsHref } from "@/config/navigation";
import { LoadingSpinner } from "@/components/common/LoadingStates";

export default function CompareRedirectPage() {
  const router = useRouter();
  const ids = router.query.ids;

  useEffect(() => {
    if (!router.isReady) return;
    const target = ids
      ? `${agentsHref("compare")}&ids=${encodeURIComponent(String(ids))}`
      : agentsHref("compare");
    router.replace(target);
  }, [router, router.isReady, ids]);

  const fallbackTarget = agentsHref("compare");

  return (
    <>
      <Head>
        <title>Compare Projects | Proof of Ship</title>
        <meta httpEquiv="refresh" content={`0;url=${fallbackTarget}`} />
      </Head>
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    </>
  );
}
