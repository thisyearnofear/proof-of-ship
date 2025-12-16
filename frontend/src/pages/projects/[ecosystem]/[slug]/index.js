import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { getEcosystemConfig } from "@/config/ecosystems";
import { getGitHubUrl } from "@/utils/projectUtils";

import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

export default function ProjectDetailPage() {
  const router = useRouter();
  const { ecosystem, slug } = router.query;
  const { currentUser, hasProjectPermission } = useAuth();
  const { getProject, loadProjectDetails } = useEnhancedGithub();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ecosystem || !slug) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProject(slug, ecosystem);
        if (!data) throw new Error("Project not found");

        if (!cancelled) setProject(data);

        // Opportunistically load extra details (issues/PRs) in the background.
        loadProjectDetails(slug, ecosystem).catch(() => {});
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load project");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ecosystem, slug, getProject, loadProjectDetails]);

  const ecosystemConfig = useMemo(
    () => getEcosystemConfig(project?.ecosystem || ecosystem),
    [project?.ecosystem, ecosystem]
  );

  const githubUrl = useMemo(() => (project ? getGitHubUrl(project) : null), [
    project,
  ]);

  const canEdit = useMemo(() => {
    if (!slug) return false;
    return Boolean(currentUser && hasProjectPermission(slug));
  }, [currentUser, hasProjectPermission, slug]);

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
            Couldn’t load project
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="outline" onClick={() => router.push("/shippers")}>
            Back to projects
          </Button>
        </Card>
      </div>
    );
  }

  if (!project) return null;

  const title = project.name || project.slug;

  return (
    <>
      <Head>
        <title>
          {title}
          {ecosystemConfig?.shortName ? ` • ${ecosystemConfig.shortName}` : ""}
        </title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

                  {ecosystemConfig && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ecosystemConfig.bgColor} ${ecosystemConfig.textColor}`}
                    >
                      <span>{ecosystemConfig.icon}</span>
                      <span>{ecosystemConfig.shortName}</span>
                    </span>
                  )}

                  {project.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-4 h-4" />
                      Verified
                    </span>
                  )}

                  {project.status && project.status !== "approved" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <ClockIcon className="w-4 h-4" />
                      {String(project.status).replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {project.description && (
                  <p className="text-gray-700 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {project.category && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TagIcon className="w-4 h-4" />
                    <span>{project.category}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/projects/${project.ecosystem || ecosystem}/${slug}/edit`
                      )
                    }
                    leftIcon={<PencilSquareIcon className="w-5 h-5" />}
                  >
                    Edit
                  </Button>
                )}

                {githubUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(githubUrl, "_blank", "noopener,noreferrer")}
                    rightIcon={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                  >
                    GitHub
                  </Button>
                )}

                {project.website && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(project.website, "_blank", "noopener,noreferrer")
                    }
                    rightIcon={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                  >
                    Website
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Onchain
              </h2>

              <div className="space-y-3 text-sm">
                <DetailRow
                  label="Contract"
                  value={project.contractAddress || "Not provided"}
                />
                <DetailRow
                  label="Deployment Tx"
                  value={project.deploymentTxHash || "Not provided"}
                />
                <DetailRow
                  label="Submitted by"
                  value={project.submittedBy || "—"}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Links
              </h2>

              <div className="space-y-3 text-sm">
                <DetailRow label="Twitter" value={project.twitter || "—"} />
                <DetailRow label="Discord" value={project.discord || "—"} />
                <DetailRow
                  label="Open source"
                  value={project.isOpenSource ? "Yes" : "No"}
                />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hackathons
            </h2>

            {Array.isArray(project.hackathons) && project.hackathons.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {project.hackathons.map((h, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {h.name || `Hackathon ${idx + 1}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {h.outcome ? `Outcome: ${h.outcome}` : "Outcome: —"}
                      </div>
                      {h.notes && (
                        <div className="text-sm text-gray-600 mt-1">{h.notes}</div>
                      )}
                    </div>

                    {h.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(h.url, "_blank", "noopener,noreferrer")
                        }
                        rightIcon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                      >
                        Link
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No hackathon submissions tracked yet.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Feedback
            </h2>
            <p className="text-gray-600 mb-4">
              Help improve this project: share what you tried, friction points, and a
              screen recording (optional).
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/feedback?project=${encodeURIComponent(slug)}`)}
            >
              Leave feedback
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-gray-500">{label}</div>
      <div className="text-gray-900 font-mono text-right break-all">
        {value}
      </div>
    </div>
  );
}
