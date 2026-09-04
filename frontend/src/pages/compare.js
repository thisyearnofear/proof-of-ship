/**
 * /compare — redirects to the Agents tab on /back.
 */

import Head from "next/head";
import { agentsHref } from "@/config/navigation";
import useRouteRedirect from "@/lib/routing/useRouteRedirect";
import { LoadingSpinner } from "@/components/common/LoadingStates";

export default function CompareRedirectPage() {
  useRouteRedirect((router) => {
    const ids = router.query.ids;
    return ids
      ? `${agentsHref("compare")}&ids=${encodeURIComponent(String(ids))}`
      : agentsHref("compare");
  });

  const fallbackTarget = agentsHref("compare");

  return (
    <>
      <Head>
        <title>Compare Projects | PledgeBond</title>
        <meta httpEquiv="refresh" content={`0;url=${fallbackTarget}`} />
      </Head>
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    </>
  );
}
