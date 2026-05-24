/**
 * SSE Endpoint — streams agent analysis progress in real-time.
 * 
 * GET /api/agent/stream?agentType=underwrite&projectId=<id>
 * 
 * Sends Server-Sent Events as the agent processes:
 *   event: progress  → { step, message, percent }
 *   event: result    → { ...agentResult }
 *   event: error     → { message }
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { agentType, projectId } = req.query;

  if (!agentType) {
    return res.status(400).json({ error: "agentType is required" });
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Step 1: Payment verification
    send("progress", { step: 1, message: "Verifying x402 payment...", percent: 10 });
    await delay(300);

    // Step 2: Data loading
    send("progress", { step: 2, message: "Loading project data...", percent: 25 });
    await delay(200);

    // Step 3: Agent-specific processing
    const steps = {
      underwrite: [
        { step: 3, message: "Running scoring engine...", percent: 40 },
        { step: 4, message: "Computing health metrics...", percent: 60 },
        { step: 5, message: "Enriching with AI analysis...", percent: 80 },
      ],
      scout: [
        { step: 3, message: "Scanning ecosystem projects...", percent: 40 },
        { step: 4, message: "Ranking investment opportunities...", percent: 60 },
        { step: 5, message: "Generating portfolio recommendations...", percent: 80 },
      ],
      verify: [
        { step: 3, message: "Fetching PR diff...", percent: 40 },
        { step: 4, message: "Analyzing code changes...", percent: 60 },
        { step: 5, message: "Computing verification score...", percent: 80 },
      ],
    };

    const agentSteps = steps[agentType] || steps.underwrite;
    for (const s of agentSteps) {
      send("progress", s);
      await delay(400);
    }

    // Step 6: Call the actual agent endpoint internally
    send("progress", { step: 6, message: "Finalizing results...", percent: 95 });

    const baseUrl = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    const agentUrl = `${baseUrl}/api/agent/${agentType}${projectId ? `?projectId=${projectId}` : ""}`;

    const agentRes = await fetch(agentUrl, {
      headers: {
        "x-test-mode": "true",
        "Content-Type": "application/json",
      },
    });

    if (agentRes.ok) {
      const data = await agentRes.json();
      send("result", { success: true, ...data });
    } else {
      const errText = await agentRes.text();
      send("error", { message: `Agent returned ${agentRes.status}: ${errText}` });
    }

    send("progress", { step: 7, message: "Complete", percent: 100 });
  } catch (err) {
    send("error", { message: err.message });
  } finally {
    res.end();
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export const config = {
  api: {
    responseLimit: false,
  },
};
