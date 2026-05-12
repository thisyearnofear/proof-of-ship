import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { useUser } from "@/contexts/UserContext";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { getEcosystemConfig } from "@/config/ecosystems";
import { db as clientDb } from "@/lib/firebase/clientApp";
import { collection, getDocs, limit, orderBy, query, where, getDoc, doc } from "firebase/firestore";
import { getGitHubUrl } from "@/utils/projectUtils";
import ethosService from "@/services/EthosService";
import { EthosScoreBadge, EthosProfileLink } from "@/components/ethos";
import ShipsLog from "@/components/projects/ShipsLog";
import ShareButtons from "@/components/common/ShareButtons";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { SkeletonDetailPage } from "@/components/common/SkeletonLoader";
import BackerActivity from "@/components/projects/BackerActivity";

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
  const { currentUser, hasProjectPermission } = useUser();
  const { getProject, loadProjectDetails } = useEnhancedGithub();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recentFeedback, setRecentFeedback] = useState([]);
  const [isAdminClient, setIsAdminClient] = useState(false);
  const [ownerEthosUser, setOwnerEthosUser] = useState(null);
  const [ownerEthosLoading, setOwnerEthosLoading] = useState(false);

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

        // Load recent feedback previews (client-side, 5 latest)
        try {
          const q = query(
            collection(clientDb, 'feedback'),
            where('projectSlug', '==', String(slug)),
            orderBy('createdAt', 'desc'),
            limit(5)
          );
          const snaps = await getDocs(q);
          if (!cancelled) {
            const items = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
            setRecentFeedback(items);
          }
        } catch (_) {
          if (!cancelled) setRecentFeedback([]);
        }

        // Opportunistically load extra details (issues/PRs) in the background.
        loadProjectDetails(slug, ecosystem).catch(() => {});
        
        // Fetch Ethos score for project owner
        if (data.ownerWalletAddress && !cancelled) {
          setOwnerEthosLoading(true);
          try {
            const ethosData = await ethosService.getScoresByAddress(data.ownerWalletAddress);
            if (!cancelled) setOwnerEthosUser(ethosData);
          } catch (e) {
            console.error('Failed to fetch owner Ethos score:', e);
          } finally {
            if (!cancelled) setOwnerEthosLoading(false);
          }
        }
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
  }, [ecosystem, slug]);

  // Client-side admin check (server still enforces)
  useEffect(() => {
    let cancelled = false;
    async function checkAdmin() {
      try {
        if (!currentUser?.uid) { setIsAdminClient(false); return; }
        const snap = await getDoc(doc(clientDb, 'users', currentUser.uid));
        const admin = snap.exists() && (snap.data().isAdmin === true || snap.data().role === 'admin');
        if (!cancelled) setIsAdminClient(Boolean(admin));
      } catch {
        if (!cancelled) setIsAdminClient(false);
      }
    }
    checkAdmin();
    return () => { cancelled = true; };
  }, [currentUser?.uid]);

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonDetailPage />
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
          <Button variant="outline" onClick={() => router.push("/explore")}>
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

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <Breadcrumbs items={[
            { label: "Explore", href: "/explore" },
            { label: ecosystemConfig?.shortName || ecosystem, href: `/explore?ecosystem=${ecosystem}` },
            { label: title },
          ]} />
          
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {ecosystemConfig && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold text-sm border border-white/30">
                      <span className="text-2xl">{ecosystemConfig.icon}</span>
                      <span>{ecosystemConfig.shortName}</span>
                    </span>
                  )}
                  
                  {project.verified && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/90 text-green-900 font-semibold text-sm border border-green-300">
                      <CheckCircleIcon className="w-5 h-5" />
                      Verified
                    </span>
                  )}
                  
                  {project.status && project.status !== "approved" && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/90 text-amber-800 font-semibold text-sm border border-amber-200">
                      <ClockIcon className="w-5 h-5" />
                      {String(project.status).replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {project.description && (
                  <p className="text-lg leading-relaxed text-white/90 max-w-3xl">
                    {project.description}
                  </p>
                )}

                {project.category && (
                  <div className="flex items-center gap-3 text-white/80">
                    <TagIcon className="w-5 h-5" />
                    <span className="font-medium">{project.category}</span>
                  </div>
                )}

                <ShareButtons title={title} className="pt-2" />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/projects/${project.ecosystem || ecosystem}/${slug}/edit`
                      )
                    }
                    leftIcon={<PencilSquareIcon className="w-5 h-5" />}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                  >
                    Edit
                  </Button>
                )}

                {githubUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(githubUrl, "_blank", "noopener,noreferrer")}
                    rightIcon={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
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
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                  >
                    Website
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BackerActivity projectSlug={slug} />
              
              <ShipsLog projectSlug={slug} canEdit={canEdit} />
              
              <Card className="p-6 border-0 shadow-lg rounded-2xl overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-amber-600" />
                  </span>
                  Recent tester submissions
                </h2>
                {recentFeedback.length > 0 ? (
                  <div className="space-y-4">
                    {recentFeedback.map((f) => (
                      <div key={f.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-amber-200 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${f.status === 'accepted' ? 'bg-green-100 text-green-700' : f.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{f.status || 'submitted'}</span>
                              {f.status === 'accepted' && f.acceptedAt && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Paid</span>
                              )}
                              {f.taskId && <span className="text-xs text-gray-500 font-medium">Task: {f.taskId}</span>}
                            </div>
                            <p className="text-gray-700 mt-3 line-clamp-3">{f.message}</p>
                            {Array.isArray(f.attachments) && f.attachments.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {f.attachments.slice(0,3).map((u, idx) => (
                                  <AttachmentThumb key={idx} url={u} />
                                ))}
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/feedback?project=${encodeURIComponent(slug)}`)} className="shrink-0">
                            Give feedback
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">No recent submissions.</p>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 border-0 shadow-lg rounded-2xl overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TagIcon className="w-6 h-6 text-purple-600" />
                  </span>
                  Details
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Contract</p>
                    <p className="font-mono text-sm text-gray-800 break-all">{project.contractAddress || "Not provided"}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Deployment Tx</p>
                    <p className="font-mono text-xs text-gray-800 break-all">{project.deploymentTxHash || "Not provided"}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Submitted by</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-semibold">{project.submittedBy || "—"}</span>
                      {project.ownerWalletAddress && (
                        ownerEthosLoading ? (
                          <span className="text-xs text-gray-500">Loading...</span>
                        ) : ownerEthosUser ? (
                          <EthosScoreBadge 
                            score={ownerEthosUser.score} 
                            ethosUser={ownerEthosUser}
                            size="sm"
                            showLabel={false}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg rounded-2xl overflow-hidden">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <ArrowTopRightOnSquareIcon className="w-6 h-6 text-blue-600" />
                  </span>
                  Links
                </h2>

                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-gray-600">Twitter</span>
                    <span className="text-sm text-gray-800 font-medium">{project.twitter || "—"}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-gray-600">Discord</span>
                    <span className="text-sm text-gray-800 font-medium">{project.discord || "—"}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-gray-600">Open source</span>
                    <span className={`text-sm font-semibold ${project.isOpenSource ? 'text-green-600' : 'text-gray-600'}`}>
                      {project.isOpenSource ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Feedback
                </h2>
                <p className="text-gray-700 mb-6">
                  Help improve this project by sharing your experience!
                </p>
                <Button
                  variant="default"
                  onClick={() => router.push(`/feedback?project=${encodeURIComponent(slug)}`)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                >
                  Leave feedback
                </Button>
              </Card>
            </div>
          </div>

          <Card className="p-6 border-0 shadow-lg rounded-2xl overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-pink-600" />
              </span>
              Hackathons
            </h2>

            {Array.isArray(project.hackathons) && project.hackathons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.hackathons.map((h, idx) => (
                  <div key={idx} className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-pink-200 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {h.name || `Hackathon ${idx + 1}`}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {h.outcome ? `Outcome: ${h.outcome}` : "Outcome: —"}
                        </p>
                        {h.notes && (
                          <p className="text-sm text-gray-600 mt-2">{h.notes}</p>
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
                          className="shrink-0"
                        >
                          Link
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No hackathon submissions tracked yet.</p>
              </div>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-lg rounded-2xl overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-yellow-600" />
              </span>
              Earn by testing
            </h2>
            {Array.isArray(project.testerTasks) && project.testerTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.testerTasks.map((t) => (
                  <div key={t.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-yellow-200 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{t.title}</h3>
                        {t.description && (
                          <p className="text-sm text-gray-600 mt-2">{t.description}</p>
                        )}
                        <p className="text-sm text-gray-700 font-semibold mt-3">
                          Reward: {Number(t.rewardUSDC || 0)} USDC
                        </p>
                        {Array.isArray(t.evidenceRequirements) && t.evidenceRequirements.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Evidence: {t.evidenceRequirements.join(', ')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/feedback?project=${encodeURIComponent(slug)}&taskId=${encodeURIComponent(t.id)}`)}
                        className="shrink-0"
                      >
                        Submit evidence
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No tester tasks available.</p>
              </div>
            )}
          </Card>

          {isAdminClient && (
            <Card className="p-6 border-2 border-red-200 shadow-lg rounded-2xl overflow-hidden bg-red-50">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 bg-red-200 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-red-600" />
                </span>
                <h2 className="text-xl font-bold text-red-900">Admin controls</h2>
              </div>
              
              <p className="text-sm text-red-800 mb-6">Approve a tester reward by feedback ID. Server-side admin check is enforced.</p>
              
              <AdminApproveForm projectSlug={slug} />

              <div className="mt-8 pt-6 border-t border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-3">Bulk approvals</h3>
                <p className="text-sm text-red-700 mb-4">Paste JSON array or CSV with headers: feedbackId,projectSlug,taskId,destinationAddress,amount. Source wallet applies to all rows.</p>
                <BulkApproveForm projectSlug={slug} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function AttachmentThumb({ url }) {
  try {
    const u = new URL(url);
    const host = u.host;
    const isImgur = host.includes('imgur.com');
    const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');
    const isLoom = host.includes('loom.com');

    if (isImgur) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block w-20 h-14 bg-gray-100 rounded overflow-hidden">
          <img src={url} alt="attachment" className="w-full h-full object-cover" />
        </a>
      );
    }
    if (isYouTube) {
      // best-effort thumbnail
      let id = '';
      if (u.searchParams.get('v')) id = u.searchParams.get('v');
      const pathParts = u.pathname.split('/').filter(Boolean);
      if (!id && pathParts.length) id = pathParts[pathParts.length-1];
      const thumb = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block w-20 h-14 bg-gray-100 rounded overflow-hidden">
          {thumb ? <img src={thumb} alt="video" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Video</div>}
        </a>
      );
    }
    if (isLoom) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="block w-20 h-14 bg-gray-100 rounded overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Loom</div>
        </a>
      );
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block w-20 h-14 bg-gray-100 rounded overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Link</div>
      </a>
    );
  } catch {
    return null;
  }
}

function AdminApproveForm({ projectSlug }) {
  const router = useRouter();
  const [feedbackId, setFeedbackId] = React.useState('');
  const [taskId, setTaskId] = React.useState('');
  const [destinationAddress, setDestinationAddress] = React.useState('');
  const [sourceWalletId, setSourceWalletId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  const prefillFromFeedback = async (id) => {
    try {
      if (!id) return;
      const res = await fetch(`/api/feedback/lookup?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.feedback && data.user && data.user.walletAddress) {
        setDestinationAddress(data.user.walletAddress);
      }
    } catch (_) {}
  };

  const onApprove = async () => {
    setError(null); setSuccess(null);
    try {
      setLoading(true);
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approveTesterReward',
          feedbackId,
          projectSlug,
          taskId,
          sourceWalletId,
          destinationAddress,
          amount: amount ? Number(amount) : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Approval failed');
      setSuccess('Approved and payout initiated');
      setFeedbackId(''); setTaskId(''); setDestinationAddress(''); setAmount('');
    } catch (e) {
      setError(e.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-3 max-w-xl">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-700">{success}</div>}
      <input className="border p-2 rounded" placeholder="Feedback ID" value={feedbackId} onChange={e=>{ setFeedbackId(e.target.value); prefillFromFeedback(e.target.value); }} />
      <input className="border p-2 rounded" placeholder="Task ID" value={taskId} onChange={e=>setTaskId(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Source Wallet ID" value={sourceWalletId} onChange={e=>setSourceWalletId(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Destination Address" value={destinationAddress} onChange={e=>setDestinationAddress(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Amount (optional)" value={amount} onChange={e=>setAmount(e.target.value)} />
      <div>
        <Button loading={loading} onClick={onApprove}>Approve & Pay</Button>
      </div>
    </div>
  );
}

function BulkApproveForm({ projectSlug }) {
  const [bulkText, setBulkText] = React.useState('');
  const [sourceWalletId, setSourceWalletId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const parseInput = () => {
    const text = bulkText.trim();
    if (!text) return [];
    // Try JSON array first
    if (text.startsWith('[')) {
      try {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) return arr.map((it) => ({ projectSlug, ...it }));
      } catch (_) {}
    }
    // Try CSV
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    const idx = {
      feedbackId: headers.indexOf('feedbackId'),
      projectSlug: headers.indexOf('projectSlug'),
      taskId: headers.indexOf('taskId'),
      destinationAddress: headers.indexOf('destinationAddress'),
      amount: headers.indexOf('amount'),
    };
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const row = {
        feedbackId: idx.feedbackId >= 0 ? cols[idx.feedbackId] : undefined,
        projectSlug: idx.projectSlug >= 0 ? cols[idx.projectSlug] : projectSlug,
        taskId: idx.taskId >= 0 ? cols[idx.taskId] : undefined,
        destinationAddress: idx.destinationAddress >= 0 ? cols[idx.destinationAddress] : undefined,
      };
      const amountStr = idx.amount >= 0 ? cols[idx.amount] : undefined;
      if (amountStr) {
        const n = Number(amountStr);
        if (!Number.isNaN(n)) row.amount = n;
      }
      rows.push(row);
    }
    return rows;
  };

  const onSubmit = async () => {
    setError(null); setResult(null);
    try {
      setLoading(true);
      const items = parseInput();
      if (!Array.isArray(items) || items.length === 0) {
        setError('No valid items parsed');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulkApproveTesterRewards', items, sourceWalletId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Bulk approve failed');
      setResult(body.results || []);
      setBulkText('');
    } catch (e) {
      setError(e.message || 'Bulk approve failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-3 max-w-2xl">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {Array.isArray(result) && result.length > 0 && (
        <div className="text-sm">
          <div className="font-medium mb-1">Results</div>
          <ul className="space-y-1">
            {result.map((r, i) => (
              <li key={i} className={r.ok ? 'text-green-700' : 'text-red-700'}>
                {r.feedbackId || 'row'}: {r.ok ? 'ok' : r.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <textarea className="border p-2 rounded min-h-[120px]" placeholder="Paste JSON array or CSV here" value={bulkText} onChange={(e)=>setBulkText(e.target.value)} />
      <input className="border p-2 rounded" placeholder="Source Wallet ID" value={sourceWalletId} onChange={(e)=>setSourceWalletId(e.target.value)} />
      <div>
        <Button loading={loading} onClick={onSubmit}>Process batch</Button>
      </div>
    </div>
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
