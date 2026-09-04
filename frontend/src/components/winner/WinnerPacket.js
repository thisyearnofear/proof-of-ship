/**
 * WinnerPacket — Underwriter-backed shareable packet for a verified (or claimed) win.
 * Runs the same analyze/underwrite path used on Agents → Analyze.
 */
import { useState } from "react";
import Button from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import useAnalyzeProject from "@/hooks/useAnalyzeProject";
import {
  ClipboardDocumentIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

/**
 * @param {{
 *   wins: Array<{ hackathonName?: string, name?: string, outcome?: string }>,
 *   projects: Array<{ id: string, name?: string, description?: string, githubUrl?: string, ecosystem?: string, slug?: string }>,
 *   payoutMatch: { name?: string, avgPayoutDays?: number | null, payoutCompletionRate?: number | null, ecosystem?: string } | null,
 * }} props
 */
export default function WinnerPacket({ wins, projects, payoutMatch }) {
  const analyze = useAnalyzeProject();
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState(projects[0]?.id || "");

  const selected = projects.find((p) => p.id === selectedId) || projects[0] || null;
  const primaryWin = wins[0] || null;

  const buildPacketText = () => {
    const lines = [
      "PledgeBond — Winner Packet",
      "────────────────────────────",
    ];
    if (primaryWin) {
      lines.push(
        `Win: ${primaryWin.hackathonName || primaryWin.name || "Verified hackathon win"}`,
        `Outcome: ${primaryWin.outcome || "winner"}`,
      );
    }
    if (payoutMatch) {
      lines.push(
        `Org avg payout: ${payoutMatch.avgPayoutDays != null ? `${payoutMatch.avgPayoutDays} days` : "not yet public"}`,
        `Payout completion: ${payoutMatch.payoutCompletionRate != null ? `${payoutMatch.payoutCompletionRate}%` : "—"}`,
        `Ecosystem: ${payoutMatch.ecosystem || "—"}`,
      );
    }
    if (selected) {
      lines.push(
        "",
        `Project: ${selected.name || "Untitled"}`,
        `Ecosystem: ${selected.ecosystem || "—"}`,
        selected.githubUrl ? `GitHub: ${selected.githubUrl}` : null,
      );
    }
    if (analyze.result?.parsed) {
      const p = analyze.result.parsed;
      lines.push(
        "",
        "Underwriter summary",
        `Score: ${p.score ?? "—"}/100`,
        p.recommendation ? `Recommendation: ${p.recommendation}` : null,
        p.summary ? `Summary: ${p.summary}` : null,
      );
      if (Array.isArray(p.strengths) && p.strengths.length) {
        lines.push("Strengths:", ...p.strengths.map((s) => `• ${s}`));
      }
      if (Array.isArray(p.risks) && p.risks.length) {
        lines.push("Risks:", ...p.risks.map((r) => `• ${r}`));
      }
    } else if (analyze.result?.text) {
      lines.push("", "Underwriter summary", analyze.result.text);
    } else {
      lines.push("", "Underwriter summary: not generated yet — run Underwriter below.");
    }
    lines.push("", "Generated on PledgeBond — https://pledgebond.com");
    return lines.filter((l) => l !== null).join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPacketText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="p-5 border border-default space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-teal-100 dark:bg-teal-900/40 p-2 text-teal-700 dark:text-teal-300">
          <DocumentTextIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-primary">Winner packet</h3>
          <p className="text-sm text-secondary mt-1">
            Win proof + payout clock + Underwriter score — the artifact you forward to ecosystems and angels.
          </p>
        </div>
      </div>

      {projects.length > 1 && (
        <div>
          <label className="text-xs font-medium text-secondary" htmlFor="packet-project">
            Project to underwrite
          </label>
          <select
            id="packet-project"
            value={selected?.id || ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.slug || p.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {projects.length === 0 && (
        <p className="text-sm text-secondary rounded-lg bg-surface-secondary p-3">
          Add a project after claiming your win so Underwriter has something to score.
        </p>
      )}

      {analyze.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{analyze.error}</p>
      )}

      {analyze.result && (
        <div className="rounded-lg bg-surface-secondary p-4 text-sm text-secondary whitespace-pre-wrap max-h-64 overflow-y-auto">
          {analyze.result.parsed ? (
            <>
              <p className="font-semibold text-primary mb-2">
                Score {analyze.result.parsed.score ?? "—"}/100
                {analyze.result.parsed.recommendation
                  ? ` · ${analyze.result.parsed.recommendation}`
                  : ""}
              </p>
              {analyze.result.parsed.summary && <p>{analyze.result.parsed.summary}</p>}
            </>
          ) : (
            analyze.result.text
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!selected || analyze.loading}
          loading={analyze.loading}
          onClick={() => selected && analyze.run(selected)}
          leftIcon={<SparklesIcon className="w-4 h-4" />}
        >
          {analyze.result ? "Re-run Underwriter" : "Generate with Underwriter"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!analyze.result && !primaryWin}
          onClick={handleCopy}
          leftIcon={<ClipboardDocumentIcon className="w-4 h-4" />}
        >
          {copied ? "Copied" : "Copy packet"}
        </Button>
      </div>
    </Card>
  );
}
