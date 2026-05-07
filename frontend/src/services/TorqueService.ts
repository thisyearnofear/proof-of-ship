/**
 * Torque Service - Event Ingestion
 *
 * Tracks user actions (project submissions, backing, AI usage, milestones)
 * via the Torque protocol for the Superteam hackathon bounty ($3K).
 *
 * Graceful no-op when TORQUE_API_KEY is not configured.
 * Client calls our /api/torque/events proxy (keeps API key server-side).
 *
 * @see https://docs.torque.so
 */

export interface TorqueEvent {
  eventName: string;
  userPubkey: string;
  timestamp: number;
  data: Record<string, unknown>;
}

class TorqueService {
  private enabled = true;

  /**
   * Send an event to the Torque ingestion API via our server-side proxy.
   * Silently returns null on failure — never blocks the caller.
   */
  async track(event: TorqueEvent): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const res = await fetch("/api/torque/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        console.warn("[Torque] event rejected:", res.status);
        return false;
      }

      return true;
    } catch (err) {
      console.warn("[Torque] event failed (non-blocking):", err);
      return false;
    }
  }

  // ── Convenience helpers ──────────────────────────────────────────────

  trackProjectSubmitted(wallet: string, project: {
    name: string;
    ecosystem: string;
    category: string;
    slug: string;
  }) {
    return this.track({
      eventName: "project_submitted",
      userPubkey: wallet,
      timestamp: Date.now(),
      data: {
        project_name: project.name,
        ecosystem: project.ecosystem,
        category: project.category,
        project_slug: project.slug,
      },
    });
  }

  trackProjectBacked(wallet: string, backing: {
    projectId: string;
    amountUsdc: string;
    ecosystem?: string;
  }) {
    return this.track({
      eventName: "project_backed",
      userPubkey: wallet,
      timestamp: Date.now(),
      data: {
        project_id: backing.projectId,
        amount_usdc: parseFloat(backing.amountUsdc) || 0,
        ecosystem: backing.ecosystem || "unknown",
      },
    });
  }

  trackAiAgentUsed(wallet: string, usage: {
    agentType: string;
    projectId: string;
    costUsdc?: string;
  }) {
    return this.track({
      eventName: "ai_agent_used",
      userPubkey: wallet,
      timestamp: Date.now(),
      data: {
        agent_type: usage.agentType,
        project_id: usage.projectId,
        cost_usdc: parseFloat(usage.costUsdc) || 0,
      },
    });
  }

  trackMilestoneCompleted(wallet: string, milestone: {
    projectId: string;
    milestoneDescription: string;
  }) {
    return this.track({
      eventName: "milestone_completed",
      userPubkey: wallet,
      timestamp: Date.now(),
      data: {
        project_id: milestone.projectId,
        milestone_description: milestone.milestoneDescription,
      },
    });
  }
}

export const torqueService = new TorqueService();
export default torqueService;
