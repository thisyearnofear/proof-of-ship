import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { useAuth } from "@/contexts/AuthContext";
import { useEnhancedGithub } from "@/providers/Github/EnhancedGithubProvider";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { getEcosystemConfig } from "@/config/ecosystems";
import { db as clientDb } from "@/lib/firebase/clientApp";
import { collection, getDocs, limit, orderBy, query, where, getDoc, doc } from "firebase/firestore";
import { getGitHubUrl } from "@/utils/projectUtils";
import ProjectShowcase from "@/components/showcase/ProjectShowcase";

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

  const [recentFeedback, setRecentFeedback] = useState([]);
  const [isAdminClient, setIsAdminClient] = useState(false);

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

          {/* Traction & Credibility Showcase */}
          <Card className="p-6">
            <ProjectShowcase project={project} />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent tester submissions
            </h2>
            {recentFeedback.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentFeedback.map((f) => (
                  <div key={f.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'accepted' ? 'bg-green-100 text-green-800' : f.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{f.status || 'submitted'}</span>
                        {f.status === 'accepted' && f.acceptedAt && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Paid</span>
                        )}
                        {f.taskId && <span className="text-xs text-gray-500">Task: {f.taskId}</span>}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 line-clamp-2">{f.message}</div>
                      {Array.isArray(f.attachments) && f.attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {f.attachments.slice(0,3).map((u, idx) => (
                            <AttachmentThumb key={idx} url={u} />
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/feedback?project=${encodeURIComponent(slug)}`)}>Give feedback</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No recent submissions.</p>
            )}
          </Card>

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

          {/* Tester Tasks */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Earn by testing</h2>
            {Array.isArray(project.testerTasks) && project.testerTasks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {project.testerTasks.map((t) => (
                  <div key={t.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-gray-900">{t.title}</div>
                      {t.description && (
                        <div className="text-sm text-gray-600 mt-1">{t.description}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        Reward: {Number(t.rewardUSDC || 0)} USDC
                      </div>
                      {Array.isArray(t.evidenceRequirements) && t.evidenceRequirements.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Evidence: {t.evidenceRequirements.join(', ')}
                        </div>
                      )}
                      {(t.startAt || t.endAt) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {t.startAt ? `Starts: ${t.startAt}` : ''} {t.endAt ? `Ends: ${t.endAt}` : ''}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/feedback?project=${encodeURIComponent(slug)}&taskId=${encodeURIComponent(t.id)}`)}
                    >
                      Submit evidence
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No tester tasks available.</p>
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

            {/* Admin Controls (client-hide, server-enforced) */}
            {isAdminClient && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Admin controls</h3>
                <p className="text-sm text-gray-600 mb-3">Approve a tester reward by feedback ID. Server-side admin check is enforced.</p>
                <AdminApproveForm projectSlug={slug} />

                <div className="mt-8">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">Bulk approvals</h4>
                  <p className="text-sm text-gray-600 mb-3">Paste JSON array or CSV with headers: feedbackId,projectSlug,taskId,destinationAddress,amount. Source wallet applies to all rows.</p>
                  <BulkApproveForm projectSlug={slug} />
                </div>
              </div>
            )}
          </Card>
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
