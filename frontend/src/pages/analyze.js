/**
 * /analyze — redirects to the Agents tab on /back.
 */

import Head from "next/head";
import { agentsHref } from "@/config/navigation";
import useRouteRedirect from "@/lib/routing/useRouteRedirect";
import { LoadingSpinner } from "@/components/common/LoadingStates";

export default function AnalyzeRedirectPage() {
  useRouteRedirect(agentsHref("analyze"));

  return (
    <>
      <Head>
        <title>Analyze Projects | PledgeBond</title>
        <meta httpEquiv="refresh" content={`0;url=${agentsHref("analyze")}`} />
      </Head>
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    </>
  );
}
