import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useUser } from "@/contexts/UserContext";
import { useBuilderCredit } from "@/contexts/WalletContext";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { Input, Textarea, Select, Checkbox } from "@/components/common/Input";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { getAllEcosystems, getEcosystemConfig } from "@/config/ecosystems";
import { submitProject } from "@/services/DataService";

import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, PhotoIcon } from "@heroicons/react/24/outline";

const DEFAULT_CATEGORIES = [
  { id: "defi", name: "DeFi" },
  { id: "nft", name: "NFTs" },
  { id: "gaming", name: "Gaming" },
  { id: "social", name: "Social" },
  { id: "infrastructure", name: "Infrastructure" },
  { id: "dao", name: "DAO" },
  { id: "other", name: "Other" },
];

export default function ProjectEditor({ projectSlug }) {
  const { currentUser, hasProjectPermission } = useUser();
  // providerData.uid for GitHub is the numeric ID — actual username is in reloadUserInfo.screenName
  const githubUsername = currentUser?.reloadUserInfo?.screenName
    || currentUser?.providerData?.find((p) => p.providerId === "github.com")?.displayName?.toLowerCase().replace(/\s/g, '')
    || null;
  const { requestFunding, connected, activeChainFamily } = useBuilderCredit();

  const isEditMode = Boolean(projectSlug);

  const [loading, setLoading] = useState(Boolean(projectSlug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const DRAFT_KEY = "project-editor-draft";

  const loadDraft = () => {
    if (isEditMode) return null;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  };

  const draft = loadDraft();

  const [form, setForm] = useState({
    name: draft?.name || "",
    description: draft?.description || "",
    githubUrl: draft?.githubUrl || "",
    ecosystem: draft?.ecosystem || (activeChainFamily === "solana" ? "solana" : "base"),
    category: draft?.category || "",
    contractAddress: draft?.contractAddress || "",
    deploymentTxHash: draft?.deploymentTxHash || "",
    website: draft?.website || "",
    twitter: draft?.twitter || "",
    discord: draft?.discord || "",
    teamMembers: draft?.teamMembers || [{ address: "", share: 100 }],
    tags: draft?.tags || "",
    isOpenSource: draft?.isOpenSource ?? true,
    lookingForFunding: draft?.lookingForFunding || false,
    fundingAmount: draft?.fundingAmount || "",
    milestones: draft?.milestones || [""],
    hackathons: draft?.hackathons || [],
    launchOnBags: draft?.launchOnBags || false,
    bagsTokenMetadata: draft?.bagsTokenMetadata || { name: "", symbol: "", description: "" },
    liveUrl: draft?.liveUrl || "",
    otherCategoryDetail: draft?.otherCategoryDetail || "",
  });

  const [showOptional, setShowOptional] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetchingGithub, setFetchingGithub] = useState(false);
  const [hasDraft, setHasDraft] = useState(Boolean(draft));
  const [draftSaved, setDraftSaved] = useState(null); // 'local' | 'cloud' | null
  const [lastCloudSave, setLastCloudSave] = useState(null);
  const [imageUrl, setImageUrl] = useState(draft?.imageUrl || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Auto-save draft to localStorage immediately, then debounce Firestore save
  useEffect(() => {
    if (isEditMode) return;
    // Save to localStorage every second (instant fallback)
    const localTimer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, imageUrl }));
        setHasDraft(true);
        setDraftSaved('local');
      } catch {}
    }, 1000);
    return () => clearTimeout(localTimer);
  }, [form, imageUrl, isEditMode]);

  // Debounced Firestore save (every 8s when form changes, only for new projects)
  useEffect(() => {
    if (isEditMode || !currentUser?.uid) return;
    const cloudTimer = setTimeout(async () => {
      try {
        const { db } = await import('@/lib/firebase/clientApp');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'drafts', currentUser.uid), {
          form,
          updatedAt: new Date().toISOString(),
          projectId: projectSlug || null,
        }, { merge: true });
        setDraftSaved('cloud');
        setLastCloudSave(new Date());
      } catch (e) {
        console.warn('Cloud draft save failed:', e);
      }
    }, 8000);
    return () => clearTimeout(cloudTimer);
  }, [form, isEditMode, currentUser?.uid, projectSlug]);

  // Load cloud draft on mount (fallback if localStorage is empty)
  useEffect(() => {
    if (isEditMode || !currentUser?.uid) return;
    if (draft) return; // localStorage already has a draft
    let cancelled = false;
    async function loadCloudDraft() {
      try {
        const { db } = await import('@/lib/firebase/clientApp');
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'drafts', currentUser.uid));
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          if (data.form && !isEditMode) {
            // Restore from cloud
            setForm(data.form);
            setHasDraft(true);
            setDraftSaved('cloud');
          }
        }
      } catch (e) {
        console.warn('Cloud draft load failed:', e);
      }
    }
    loadCloudDraft();
    return () => { cancelled = true; };
  }, [currentUser?.uid, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setHasDraft(false);
    setDraftSaved(null);
    // Also clear cloud draft
    if (currentUser?.uid) {
      import('@/lib/firebase/clientApp').then(({ db }) => {
        import('firebase/firestore').then(({ doc, deleteDoc }) => {
          deleteDoc(doc(db, 'drafts', currentUser.uid)).catch(() => {});
        });
      });
    }
  };

  const ecosystemOptions = useMemo(() => {
    return getAllEcosystems().filter((e) => e.dataSource !== 'special');
  }, []);

  const ecosystemConfig = useMemo(
    () => getEcosystemConfig(form.ecosystem),
    [form.ecosystem]
  );

  const categoryOptions = useMemo(() => {
    if (Array.isArray(ecosystemConfig?.categories) && ecosystemConfig.categories.length) {
      return ecosystemConfig.categories.map((id) => ({ id, name: id.toUpperCase() }));
    }
    return DEFAULT_CATEGORIES;
  }, [ecosystemConfig]);

  useEffect(() => {
    if (!projectSlug) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/projects/${projectSlug}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load project");
        }

        const project = await res.json();

        if (cancelled) return;

        setForm({
          name: project.name || "",
          description: project.description || "",
          githubUrl: project.githubUrl
            ? project.githubUrl
            : project.owner && project.repo
              ? `https://github.com/${project.owner}/${project.repo}`
              : "",
          ecosystem: project.ecosystem || "base",
          category: project.category || "",
          contractAddress: project.contractAddress || "",
          deploymentTxHash: project.deploymentTxHash || "",
          website: project.website || "",
          twitter: project.twitter || "",
          discord: project.discord || "",
          teamMembers:
            Array.isArray(project.teamMembers) && project.teamMembers.length
              ? project.teamMembers.map(m => 
                  typeof m === 'string' ? { address: m, share: 0 } : m
                )
              : [{ address: "", share: 100 }],
          tags: Array.isArray(project.tags) ? project.tags.join(", ") : project.tags || "",
          isOpenSource:
            project.isOpenSource === undefined ? true : Boolean(project.isOpenSource),
          lookingForFunding: Boolean(project.lookingForFunding),
          fundingAmount: project.fundingAmount || "",
          milestones:
            Array.isArray(project.milestones) && project.milestones.length
              ? project.milestones
              : [""],
          hackathons: Array.isArray(project.hackathons) ? project.hackathons : [],
          liveUrl: project.liveUrl || "",
          otherCategoryDetail: project.otherCategoryDetail || "",
        });
        setImageUrl(project.imageUrl || "");
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
  }, [projectSlug]);

  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    if (!isEditMode) return true;
    return hasProjectPermission(projectSlug);
  }, [currentUser, hasProjectPermission, isEditMode, projectSlug]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field, value = "") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], value] }));
  };

  const removeArrayItem = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addHackathon = () => {
    setForm((prev) => ({
      ...prev,
      hackathons: [
        ...(prev.hackathons || []),
        { name: "", url: "", outcome: "", payoutAt: "", notes: "" },
      ],
    }));
  };

  const updateHackathon = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      hackathons: prev.hackathons.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const removeHackathon = (index) => {
    setForm((prev) => ({
      ...prev,
      hackathons: prev.hackathons.filter((_, i) => i !== index),
    }));
  };

  // Auto-populate from GitHub URL — limited to authenticated user's repos
  const fetchGithubInfo = useCallback(async (url) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [, owner, repo] = match;

    // Validate repo belongs to the authenticated GitHub user
    if (githubUsername && owner.toLowerCase() !== githubUsername.toLowerCase()) {
      setError(`This project must be under your GitHub account (${githubUsername}). You can only submit repos you own.`);
      return;
    }

    setFetchingGithub(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace(".git", "")}`);
      if (!res.ok) return;
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        name: prev.name || data.name || "",
        description: prev.description || data.description || "",
        tags: prev.tags || (data.topics || []).join(", "),
        isOpenSource: !data.private,
      }));
    } catch {} finally {
      setFetchingGithub(false);
    }
  }, [githubUsername]);

  const githubUrlRef = useRef(form.githubUrl);
  useEffect(() => {
    const prev = githubUrlRef.current;
    githubUrlRef.current = form.githubUrl;
    if (form.githubUrl && form.githubUrl !== prev && form.githubUrl.includes("github.com/")) {
      fetchGithubInfo(form.githubUrl);
    }
  }, [form.githubUrl, fetchGithubInfo]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

    // Validate dimensions and size
    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image must be under 2MB");
      return;
    }

    setUploadingImage(true);
    try {
      // Resize to consistent dimensions (1200x630 — OG image standard)
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const canvas = document.createElement("canvas");
      const targetW = 1200;
      const targetH = 630;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");

      // Center-crop to fill target dimensions
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (targetW - w) / 2, (targetH - h) / 2, w, h);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));

      // Upload to Grove (Lens decentralized storage — free, no auth required)
      const resp = await fetch("https://api.grove.storage/?chain_id=37111", {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });

      if (!resp.ok) {
        throw new Error(`Grove upload failed: ${resp.status}`);
      }

      const result = await resp.json();
      // Grove returns an array: [{ gateway_url, storage_key, uri }]
      const file = Array.isArray(result) ? result[0] : result;
      setImageUrl(file.gateway_url || `https://api.grove.storage/${file.storage_key}`);
    } catch (err) {
      console.error("Image upload failed:", err);
      setImageError("Upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return "Project name is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.githubUrl.trim() || !form.githubUrl.includes("github.com")) {
      return "A valid GitHub URL is required";
    }
    if (githubUsername) {
      const match = form.githubUrl.match(/github\.com\/([^/]+)\//);
      if (match && match[1].toLowerCase() !== githubUsername.toLowerCase()) {
        return `GitHub URL must be under your account (${githubUsername})`;
      }
    }
    if (!form.ecosystem) return "Chain / ecosystem is required";
    if (!form.category) return "Category is required";
    if (form.category === "other" && !form.otherCategoryDetail?.trim()) {
      return "Please specify what kind of project this is (Other category)";
    }
    if (form.contractAddress.trim() && !form.contractAddress.trim().startsWith("0x")) {
      return "Contract address must start with 0x";
    }
    
    const filledMembers = (form.teamMembers || []).filter(m => m.address && m.address.trim());
    if (filledMembers.length > 0) {
      const totalShares = filledMembers.reduce((sum, m) => sum + (parseInt(m.share) || 0), 0);
      if (totalShares !== 100) {
        return `Total team shares must equal 100% (currently ${totalShares}%)`;
      }
    }
    
    return null;
  };

  const handleDelete = async () => {
    if (!isEditMode || !projectSlug) return;
    if (!window.confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/projects/${projectSlug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete project");
      }
      window.location.href = "/profile";
    } catch (e) {
      setError(e.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentUser) {
      setError("Please sign in to save a project.");
      return;
    }

    if (!canEdit) {
      setError("You do not have permission to edit this project.");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const cleaned = {
      name: form.name.trim(),
      description: form.description.trim(),
      githubUrl: form.githubUrl.trim(),
      liveUrl: form.liveUrl.trim() || null,
      ecosystem: form.ecosystem,
      category: form.category,
      otherCategoryDetail: form.category === "other" ? (form.otherCategoryDetail || "").trim() : null,
      contractAddress: form.contractAddress.trim(),
      deploymentTxHash: form.deploymentTxHash.trim() || null,
      website: form.website.trim() || null,
      twitter: form.twitter.trim() || null,
      discord: form.discord.trim() || null,
      teamMembers: (form.teamMembers || [])
        .filter((t) => t.address && t.address.trim())
        .map((t) => ({
          address: String(t.address).trim(),
          share: parseInt(t.share) || 0
        })),
      tags: String(form.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isOpenSource: Boolean(form.isOpenSource),
      lookingForFunding: Boolean(form.lookingForFunding),
      fundingAmount: form.lookingForFunding ? form.fundingAmount || null : null,
      milestones: (form.milestones || []).map((m) => String(m).trim()).filter(Boolean),
      hackathons: Array.isArray(form.hackathons)
        ? form.hackathons
            .map((h) => ({
              name: String(h.name || "").trim(),
              url: String(h.url || "").trim(),
              outcome: String(h.outcome || "").trim(),
              payoutAt: String(h.payoutAt || "").trim(),
              notes: String(h.notes || "").trim(),
            }))
            .filter((h) => h.name || h.url || h.outcome || h.payoutAt || h.notes)
        : [],
    };

    try {
      if (isEditMode) {
        const token = await currentUser.getIdToken();
        const res = await fetch(`/api/projects/${projectSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...cleaned, imageUrl: imageUrl || null }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to update project");
        }

        setSuccess("Project updated");

        setTimeout(() => {
          window.location.href = `/projects/${cleaned.ecosystem}/${projectSlug}`;
        }, 600);
      } else {
        // On-chain funding/Bags launch for Solana (Phase 8: Bags Hackathon)
        let onChainResult = null;
        if (cleaned.ecosystem === 'solana' && (form.lookingForFunding || form.launchOnBags)) {
          if (!connected || activeChainFamily !== 'solana') {
            throw new Error("Please connect your Solana wallet to request funding or launch on Bags.");
          }

          try {
            // Prepare on-chain data
            const onChainData = {
              ...cleaned,
              hackathonIds: [1], // Default hackathon ID
              milestoneDescriptions: cleaned.milestones,
              milestoneAmounts: cleaned.milestones.map(() => 0), // Demo: 0 reward for now
              launchOnBags: form.launchOnBags,
              bagsTokenMetadata: form.bagsTokenMetadata
            };

            onChainResult = await requestFunding(onChainData);
            console.log('Solana on-chain result:', onChainResult);
          } catch (err) {
            console.error('On-chain operation failed:', err);
            throw new Error(`Blockchain operation failed: ${err.message}`);
          }
        }

        let result;
        let useClientSide = false;
        
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch("/api/projects/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              ...cleaned,
              imageUrl: imageUrl || null,
              launchOnBags: form.launchOnBags,
              bagsTokenAddress: onChainResult?.projectData?.bagsTokenAddress || null,
              solanaProjectPda: onChainResult?.projectPda || null,
              builderSnsDomain: onChainResult?.projectData?.builderSnsDomain || cleaned.builderSnsDomain || null,
              builderSnsNameAccount: onChainResult?.projectData?.builderSnsNameAccount || null,
              submittedBy: currentUser.uid,
              submittedAt: new Date().toISOString(),
            }),
          });

          const contentType = res.headers.get("content-type") || "";
          
          if (!contentType.includes("application/json")) {
            useClientSide = true;
          } else if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || "Failed to submit project");
          } else {
            result = await res.json();
          }
        } catch (fetchError) {
          if (fetchError.message?.includes("<!DOCTYPE") || fetchError.message?.includes("Unexpected token")) {
            useClientSide = true;
          } else {
            throw fetchError;
          }
        }

        if (useClientSide) {
          const clientResult = await submitProject(cleaned);
          if (!clientResult.success) {
            throw new Error(clientResult.error || "Failed to submit project");
          }
          result = clientResult;
        }

        clearDraft();
        setSuccess("Project submitted");

        const createdSlug = result.projectSlug;
        // Torque event — fire and forget
        import('@/services/TorqueService').then(({ torqueService }) => {
          torqueService.trackProjectSubmitted(form.ecosystem === 'solana' && connected ? 'solana-wallet' : 'unknown', {
            name: cleaned.name,
            ecosystem: cleaned.ecosystem,
            category: cleaned.category,
            slug: createdSlug,
          });
        }).catch(() => {});
        setTimeout(() => {
          window.location.href = `/projects/${cleaned.ecosystem}/${createdSlug}`;
        }, 600);
      }
    } catch (e) {
      setError(e.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card className="p-6">
        <div className="text-gray-700">Please sign in to continue.</div>
      </Card>
    );
  }

  if (!canEdit) {
    return (
      <Card className="p-6">
        <div className="text-red-700">
          You do not have permission to edit this project.
        </div>
      </Card>
    );
  }

  // Progress checklist — tracks required fields for submission
  const checklist = [
    { label: "Project name", done: Boolean(form.name?.trim()) },
    { label: "Description", done: Boolean(form.description?.trim() && form.description.trim().length >= 20) },
    { label: "GitHub repo", done: Boolean(form.githubUrl?.trim() && form.githubUrl.includes("github.com")) },
    { label: "Ecosystem", done: Boolean(form.ecosystem) },
    { label: "Category", done: Boolean(form.category) },
  ];
  const completedCount = checklist.filter(c => c.done).length;
  const allRequired = checklist.every(c => c.done);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? "Edit project" : "Add a project"}
            </h2>
            <p className="text-gray-600 mt-1">
              Keep it crisp. Links + contract address are the minimum viable proof.
            </p>
            {/* Draft status indicator */}
            {!isEditMode && draftSaved && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${draftSaved === 'cloud' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <span className="text-[11px] text-gray-500">
                  {draftSaved === 'cloud'
                    ? `Draft saved${lastCloudSave ? ` at ${lastCloudSave.toLocaleTimeString()}` : ''}`
                    : 'Draft saved locally'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Progress checklist */}
            {!isEditMode && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {checklist.map((item, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${item.done ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={item.label}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium ${allRequired ? 'text-green-600' : 'text-gray-500'}`}>
                  {completedCount}/{checklist.length}
                </span>
              </div>
            )}
            <Button type="submit" loading={saving}>
              {isEditMode ? "Save" : "Submit"}
            </Button>
          </div>
        </div>

        {!isEditMode && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">What makes your project look great to backers:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5">
              <li><strong>Clear description</strong> — What does it do, who is it for, what&apos;s onchain? (2-3 sentences minimum)</li>
              <li><strong>GitHub repo</strong> — Public repos with recent commits boost your health score significantly</li>
              <li><strong>Correct ecosystem</strong> — Pick the chain you&apos;re building on so backers can filter to you</li>
              <li><strong>Website or Twitter</strong> — Social links increase backer confidence by up to 10 points</li>
              <li><strong>Milestones</strong> — Concrete deliverables backers can track (&ldquo;Ship v1 by May 10&rdquo; not &ldquo;Build stuff&rdquo;)</li>
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
            {success}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">Basics</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Project name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            required
          />

          <Select
            label="Chain"
            value={form.ecosystem}
            onChange={(e) => setField("ecosystem", e.target.value)}
            required
          >
            {ecosystemOptions.map((eco) => (
              <option key={eco.id} value={eco.id}>
                {eco.shortName}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="What does it do, who is it for, and what’s onchain?"
          rows={4}
          required
        />

        {/* Project image — consistent card display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project image
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Shown on project cards and backer feeds. Auto-resized to 1200×630. Max 2MB.
          </p>
          <div className="flex items-start gap-4">
            {imageUrl ? (
              <div className="relative w-40 h-[84px] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                <img src={imageUrl} alt="Project preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 h-[84px] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0">
                <PhotoIcon className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Upload image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
            {uploadingImage && <LoadingSpinner size="sm" />}
            {imageError && <span className="text-xs text-red-600">{imageError}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="GitHub repository"
            value={form.githubUrl}
            onChange={(e) => setField("githubUrl", e.target.value)}
            placeholder="https://github.com/org/repo"
            required
          />
          <div className="text-xs text-gray-600">
            {fetchingGithub ? "⏳ Auto-populating from GitHub..." : "Paste a GitHub URL to auto-fill project details."}
          </div>

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Live app link"
            value={form.liveUrl}
            onChange={(e) => setField("liveUrl", e.target.value)}
            placeholder="https://yourapp.com — where users can try it"
          />
        </div>

        {form.category === "other" && (
          <Input
            label="What kind of project is this?"
            value={form.otherCategoryDetail}
            onChange={(e) => setField("otherCategoryDetail", e.target.value)}
            placeholder="e.g. AI tooling, data indexer, developer SDK..."
            required
          />
        )}

        {Array.isArray(ecosystemConfig?.submissionRequirements) &&
          ecosystemConfig.submissionRequirements.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-gray-900 mb-2">
                {ecosystemConfig.shortName} submission checklist
              </div>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                {ecosystemConfig.submissionRequirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
      </Card>

      {/* Collapsible optional sections */}
      <button
        type="button"
        className="w-full flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={() => setShowOptional(!showOptional)}
      >
        <span className="flex items-center gap-2">
          {showOptional ? "Hide" : "Show"} optional details
          <span className="text-xs text-blue-600 font-normal">— projects with links get 3× more backer views</span>
        </span>
        {showOptional ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
      </button>

      {showOptional && (<>
      <Card className="p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Onchain</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contract address (optional)"
            value={form.contractAddress}
            onChange={(e) => setField("contractAddress", e.target.value)}
            placeholder="0x... (leave blank if not deployed yet)"
          />
          <Input
            label="Deployment tx (optional)"
            value={form.deploymentTxHash}
            onChange={(e) => setField("deploymentTxHash", e.target.value)}
            placeholder="0x..."
          />
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Links & Team</h3>
          <p className="text-sm text-gray-500 mt-1">
            Backers look for signals that you're real and active. A Twitter/X account shows your builder journey.
            Discord shows community engagement. A website shows you care about users, not just code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label="Twitter / X"
              value={form.twitter}
              onChange={(e) => setField("twitter", e.target.value)}
              placeholder="https://x.com/yourhandle"
            />
            <p className="text-xs text-gray-500 mt-1">Build in public. Backers follow your progress here.</p>
          </div>
          <div>
            <Input
              label="Discord"
              value={form.discord}
              onChange={(e) => setField("discord", e.target.value)}
              placeholder="https://discord.gg/yourserver"
            />
            <p className="text-xs text-gray-500 mt-1">Shows you have a community. Backers love early traction.</p>
          </div>
          <div>
            <Input
              label="Website"
              value={form.website}
              onChange={(e) => setField("website", e.target.value)}
              placeholder="https://yourapp.com"
            />
            <p className="text-xs text-gray-500 mt-1">Landing page, docs, or demo — any link where users can try it.</p>
          </div>
        </div>

        <Input
          label="Tags (comma separated)"
          value={form.tags}
          onChange={(e) => setField("tags", e.target.value)}
          placeholder="payments, defi, wallets"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Open source"
            checked={form.isOpenSource}
            onChange={(e) => setField("isOpenSource", e.target.checked)}
          />
          <Checkbox
            label="Looking for funding"
            checked={form.lookingForFunding}
            onChange={(e) => setField("lookingForFunding", e.target.checked)}
          />

          {form.ecosystem === 'solana' && (
            <div className="md:col-span-2">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <h4 className="font-semibold text-emerald-900">Bags Boost (Hackathon Special)</h4>
                      <p className="text-sm text-emerald-700">Launch a token on Bags alongside your credit request for community-backed liquidity.</p>
                    </div>
                  </div>
                  <Checkbox
                    label="Active"
                    checked={form.launchOnBags}
                    onChange={(e) => setField("launchOnBags", e.target.checked)}
                  />
                </div>

                {form.launchOnBags && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-emerald-100">
                    <Input
                      label="Token Name"
                      placeholder="e.g. Proof of Ship Token"
                      value={form.bagsTokenMetadata.name}
                      onChange={(e) => setField("bagsTokenMetadata", { ...form.bagsTokenMetadata, name: e.target.value })}
                    />
                    <Input
                      label="Token Symbol"
                      placeholder="e.g. SHIP"
                      value={form.bagsTokenMetadata.symbol}
                      onChange={(e) => setField("bagsTokenMetadata", { ...form.bagsTokenMetadata, symbol: e.target.value.toUpperCase() })}
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        label="Token Description"
                        placeholder="Describe the utility or vision for your project token..."
                        value={form.bagsTokenMetadata.description}
                        onChange={(e) => setField("bagsTokenMetadata", { ...form.bagsTokenMetadata, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {form.lookingForFunding && (
          <Input
            label="Funding amount (optional)"
            value={form.fundingAmount}
            onChange={(e) => setField("fundingAmount", e.target.value)}
            placeholder="$500 - $5,000"
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Team Members & Shares</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("teamMembers", { address: "", share: 0 })}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Add Member
            </Button>
          </div>

          <div className="space-y-3">
            {form.teamMembers.map((member, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex-1 w-full">
                  <Input
                    label="Wallet Address / GitHub"
                    value={member.address || ""}
                    onChange={(e) =>
                      updateArrayItem("teamMembers", idx, { ...member, address: e.target.value })
                    }
                    placeholder="0x... or username"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Input
                    label="Share %"
                    type="number"
                    min="0"
                    max="100"
                    value={member.share || 0}
                    onChange={(e) =>
                      updateArrayItem("teamMembers", idx, { ...member, share: parseInt(e.target.value) || 0 })
                    }
                    placeholder="%"
                  />
                </div>
                <div className="sm:pt-7">
                  {form.teamMembers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeArrayItem("teamMembers", idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Set 100% for single developers. For teams, total must equal 100% for automated splits.
            </p>
            <div className={`text-sm font-bold ${
              form.teamMembers.reduce((sum, m) => sum + (parseInt(m.share) || 0), 0) === 100 
              ? 'text-green-600' : 'text-orange-600'
            }`}>
              Total Share: {form.teamMembers.reduce((sum, m) => sum + (parseInt(m.share) || 0), 0)}%
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>

        <div className="space-y-2">
          {form.milestones.map((m, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={m}
                onChange={(e) => updateArrayItem("milestones", idx, e.target.value)}
                placeholder="What will you ship next?"
                className="flex-1"
              />
              {form.milestones.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeArrayItem("milestones", idx)}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => addArrayItem("milestones")}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Add milestone
        </Button>
      </Card>

      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hackathons</h3>
            <p className="text-gray-600 text-sm">
              Track where you’re submitting, outcomes, and time-to-payout.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addHackathon}
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>

        {form.hackathons.length === 0 ? (
          <div className="text-gray-600">No hackathons yet.</div>
        ) : (
          <div className="space-y-4">
            {form.hackathons.map((h, idx) => (
              <Card key={idx} className="p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-gray-900">
                    Hackathon {idx + 1}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeHackathon(idx)}
                    leftIcon={<TrashIcon className="w-4 h-4" />}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <Input
                    label="Name"
                    value={h.name}
                    onChange={(e) => updateHackathon(idx, "name", e.target.value)}
                    placeholder="ETHGlobal…"
                  />
                  <Input
                    label="Submission / announcement URL"
                    value={h.url}
                    onChange={(e) => updateHackathon(idx, "url", e.target.value)}
                    placeholder="https://..."
                  />
                  <Input
                    label="Outcome"
                    value={h.outcome}
                    onChange={(e) =>
                      updateHackathon(idx, "outcome", e.target.value)
                    }
                    placeholder="Submitted / finalist / winner / not selected"
                  />
                  <Input
                    label="Payout received at (optional)"
                    value={h.payoutAt}
                    onChange={(e) =>
                      updateHackathon(idx, "payoutAt", e.target.value)
                    }
                    placeholder="2025-12-01"
                  />
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Notes"
                    value={h.notes}
                    onChange={(e) => updateHackathon(idx, "notes", e.target.value)}
                    placeholder="Key improvements, judge feedback, what you’d do differently…"
                    rows={3}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
      </>)}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile progress checklist (hidden on sm+) */}
          {!isEditMode && (
            <div className="flex sm:hidden items-center gap-1.5">
              {checklist.map((item, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${item.done ? 'bg-green-500' : 'bg-gray-300'}`}
                  title={item.label}
                />
              ))}
              <span className={`text-xs font-medium ml-1 ${allRequired ? 'text-green-600' : 'text-gray-500'}`}>
                {completedCount}/{checklist.length}
              </span>
            </div>
          )}
          {isEditMode && (
            <Button type="button" variant="outline" onClick={handleDelete} loading={deleting} className="text-red-600 border-red-300 hover:bg-red-50">
              Delete Project
            </Button>
          )}
          {hasDraft && !isEditMode && (
            <button type="button" onClick={() => { clearDraft(); window.location.reload(); }} className="text-xs text-gray-500 hover:text-red-500 underline">
              Clear saved draft
            </button>
          )}
        </div>
        <Button type="submit" loading={saving} disabled={!isEditMode && !allRequired}>
          {isEditMode ? "Save changes" : "Submit project"}
        </Button>
      </div>
    </form>
  );
}
