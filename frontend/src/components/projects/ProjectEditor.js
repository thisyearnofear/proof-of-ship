import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/common/Card";
import Button from "@/components/common/Button";
import { Input, Textarea, Select, Checkbox } from "@/components/common/Input";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import { getAllEcosystems, getEcosystemConfig } from "@/config/ecosystems";
import { submitProject as submitProjectClient } from "@/services/ClientProjectService";

import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

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
  const { currentUser, hasProjectPermission } = useAuth();

  const isEditMode = Boolean(projectSlug);

  const [loading, setLoading] = useState(Boolean(projectSlug));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    githubUrl: "",
    ecosystem: "base",
    category: "",
    contractAddress: "",
    deploymentTxHash: "",
    website: "",
    twitter: "",
    discord: "",
    teamMembers: [""],
    tags: "",
    isOpenSource: true,
    lookingForFunding: false,
    fundingAmount: "",
    milestones: [""],
    hackathons: [],
  });

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
              ? project.teamMembers
              : [""],
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
        });
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

  const validate = () => {
    if (!form.name.trim()) return "Project name is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.githubUrl.trim() || !form.githubUrl.includes("github.com")) {
      return "A valid GitHub URL is required";
    }
    if (!form.ecosystem) return "Chain / ecosystem is required";
    if (!form.category) return "Category is required";
    if (!form.contractAddress.trim().startsWith("0x")) {
      return "A valid contract address is required";
    }
    return null;
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
      ecosystem: form.ecosystem,
      category: form.category,
      contractAddress: form.contractAddress.trim(),
      deploymentTxHash: form.deploymentTxHash.trim() || null,
      website: form.website.trim() || null,
      twitter: form.twitter.trim() || null,
      discord: form.discord.trim() || null,
      teamMembers: (form.teamMembers || []).map((t) => String(t).trim()).filter(Boolean),
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
        const res = await fetch(`/api/projects/${projectSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleaned),
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
        let result;
        let useClientSide = false;
        
        try {
          const res = await fetch("/api/projects/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...cleaned,
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
          const clientResult = await submitProjectClient(cleaned);
          if (!clientResult.success) {
            throw new Error(clientResult.error || "Failed to submit project");
          }
          result = clientResult;
        }

        setSuccess("Project submitted");

        const createdSlug = result.projectSlug;
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

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? "Edit project" : "Add a project"}
            </h2>
            <p className="text-gray-600 mt-1">
              Keep it crisp. Links + contract address are the minimum viable proof.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" loading={saving}>
              {isEditMode ? "Save" : "Submit"}
            </Button>
          </div>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="GitHub repository"
            value={form.githubUrl}
            onChange={(e) => setField("githubUrl", e.target.value)}
            placeholder="https://github.com/org/repo"
            required
          />
          <div className="text-xs text-gray-600">
            Verify repo ownership to speed up review. If not connected, submission may be marked pending review.
          </div>
          <div className="mt-2">
            <Button type="button" variant="outline" onClick={async ()=>{
              try {
                await (await import('@/contexts/AuthContext')).useAuth().signInWithGithub();
              } catch (e) { console.warn('GitHub connect failed'); }
            }}>Connect GitHub</Button>
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
        </div>

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

      <Card className="p-6 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">Onchain</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contract address"
            value={form.contractAddress}
            onChange={(e) => setField("contractAddress", e.target.value)}
            placeholder="0x..."
            required
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
        <h3 className="text-lg font-semibold text-gray-900">Links & team</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Website (optional)"
            value={form.website}
            onChange={(e) => setField("website", e.target.value)}
            placeholder="https://..."
          />
          <Input
            label="Twitter (optional)"
            value={form.twitter}
            onChange={(e) => setField("twitter", e.target.value)}
            placeholder="https://twitter.com/..."
          />
          <Input
            label="Discord (optional)"
            value={form.discord}
            onChange={(e) => setField("discord", e.target.value)}
            placeholder="https://discord.gg/..."
          />
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
            <div className="text-sm font-medium text-gray-900">Team members</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("teamMembers")}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {form.teamMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={member}
                  onChange={(e) =>
                    updateArrayItem("teamMembers", idx, e.target.value)
                  }
                  placeholder="Name / GitHub / Farcaster"
                  className="flex-1"
                />
                {form.teamMembers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeArrayItem("teamMembers", idx)}
                    leftIcon={<TrashIcon className="w-4 h-4" />}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
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

      <div className="flex items-center justify-end">
        <Button type="submit" loading={saving}>
          {isEditMode ? "Save changes" : "Submit project"}
        </Button>
      </div>
    </form>
  );
}
