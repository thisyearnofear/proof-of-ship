import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import EcosystemSection from "@/components/dashboard/EcosystemSection";
import ErrorBoundary from "@/components/ErrorBoundary";

import {
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function UserPortfolioPage() {
  const router = useRouter();
  const { username } = router.query;
  const { currentUser } = useAuth();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/portfolio/${username}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load portfolio");
        }

        const data = await res.json();
        if (!cancelled) setPortfolio(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const projectsByEcosystem = useMemo(() => {
    const grouped = {};
    for (const p of portfolio?.projects || []) {
      const eco = p.ecosystem || "unknown";
      grouped[eco] = grouped[eco] || [];
      grouped[eco].push(p);
    }
    return grouped;
  }, [portfolio]);

  const isOwner = useMemo(() => {
    if (!currentUser || !portfolio?.user?.uid) return false;
    return currentUser.uid === portfolio.user.uid;
  }, [currentUser, portfolio]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Portfolio not found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => router.push("/")}>Go home</Button>
            <Button variant="outline" onClick={() => router.push("/shippers")}>Explore projects</Button>
          </div>
        </Card>
      </div>
    );
  }

  const displayName =
    portfolio?.user?.displayName || portfolio?.user?.githubUsername || username;

  return (
    <>
      <Head>
        <title>{displayName} • Onchain Projects</title>
        <meta
          name="description"
          content={`Onchain projects by ${displayName}, organized by chain.`}
        />
      </Head>

      <ErrorBoundary
        name="UserPortfolio"
        errorMessage="Failed to load portfolio. Please refresh the page."
      >
        <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {portfolio?.user?.photoURL ? (
                  <img
                    src={portfolio.user.photoURL}
                    alt={displayName}
                    className="w-14 h-14 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center font-semibold">
                    {String(displayName).slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {displayName}
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <a
                      href={`https://github.com/${portfolio?.user?.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-gray-900"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      <span>@{portfolio?.user?.githubUsername}</span>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                    <span className="text-gray-300">•</span>
                    <span>{portfolio?.projects?.length || 0} projects</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner ? (
                  <Button
                    onClick={() => router.push("/projects/new")}
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                  >
                    Add project
                  </Button>
                ) : (
                  <Link href="/projects/new" className="inline-flex">
                    <Button
                      variant="outline"
                      leftIcon={<PlusIcon className="w-5 h-5" />}
                    >
                      Submit your project
                    </Button>
                  </Link>
                )}

                <Link href="/shippers" className="inline-flex">
                  <Button variant="outline">Explore all projects</Button>
                </Link>
              </div>
            </div>
          </Card>

          {Object.keys(projectsByEcosystem).length === 0 ? (
            <Card className="p-10 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No projects yet
              </h2>
              <p className="text-gray-600 mb-6">
                {isOwner
                  ? "Add your first project and start building your onchain portfolio."
                  : "This builder hasn’t published any projects yet."}
              </p>
              {isOwner && (
                <Button
                  onClick={() => router.push("/projects/new")}
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                >
                  Add your first project
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(projectsByEcosystem).map(([ecosystem, projects]) => (
                <EcosystemSection
                  key={ecosystem}
                  ecosystem={ecosystem}
                  projects={projects}
                  totalProjects={projects.length}
                  isExpanded
                  viewMode="grid"
                  showControls={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
        </ErrorBoundary>
    </>
  );
}
