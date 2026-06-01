/**
 * Explore — Tabbed discovery surface for projects, builders, and
 * hackathons. Tab routing lives here; each tab is a self-contained
 * component in `@/components/explore`. Tabs are lazy-loaded via
 * `next/dynamic` so the heaviest one (ProjectsTab) doesn't ship in the
 * initial bundle for users landing on the builders or hackathons tab.
 */

import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import TabBar from "@/components/common/TabBar";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import LiveAgentTicker from "@/components/common/LiveAgentTicker";
import ErrorBoundary from "@/components/ErrorBoundary";

const ProjectsTab = dynamic(() => import("@/components/explore/ProjectsTab").then((m) => m.default), {
  ssr: false,
  loading: () => null,
});
const BuildersTab = dynamic(() => import("@/components/explore/BuildersTab").then((m) => m.default), {
  ssr: false,
  loading: () => null,
});
const HackathonsTab = dynamic(() => import("@/components/explore/HackathonsTab").then((m) => m.default), {
  ssr: false,
  loading: () => null,
});

const TABS = [
  { id: "projects", label: "Projects" },
  { id: "builders", label: "Builders" },
  { id: "hackathons", label: "Hackathons" },
];

export default function ExplorePage() {
  const router = useRouter();
  const tab = router.query.tab || "projects";
  const setTab = (t) => {
    router.replace(
      { pathname: router.pathname, query: t === "projects" ? {} : { tab: t } },
      undefined,
      { shallow: true },
    );
  };

  return (
    <ErrorBoundary name="ExplorePage" errorMessage="Failed to load. Please refresh.">
      <Head><title>Explore — Proof of Ship</title></Head>
      <div className="min-h-screen bg-surface-secondary">
        <LiveAgentTicker />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: "Explore" }]} />
          <TabBar tabs={TABS} activeTab={tab} onChange={setTab} variant="pill" className="mb-6" />
          {tab === "projects" ? <ProjectsTab /> : tab === "builders" ? <BuildersTab /> : <HackathonsTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}
