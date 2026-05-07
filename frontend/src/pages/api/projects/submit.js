import { db, auth } from "../../../lib/firebase/serverOnly";
import { verifyAuth, withApiMiddleware } from "../../../utils/apiMiddleware";
import { logActivity } from "../../../utils/activityLogger";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify auth token
    const userId = await verifyAuth(req, auth);

    const projectData = { ...(req.body || {}) };

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "githubUrl",
      "ecosystem",
      "category",
    ];
    const missingFields = requiredFields.filter((field) => !projectData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields,
      });
    }

    // Validate GitHub URL
    if (!projectData.githubUrl.includes("github.com")) {
      return res.status(400).json({
        error: "Invalid GitHub URL",
      });
    }

    // Validate contract address (optional)
    if (projectData.contractAddress && !projectData.contractAddress.startsWith("0x")) {
      return res.status(400).json({
        error: "Invalid contract address format",
      });
    }

    // Generate project slug
    const slug = generateSlug(projectData.name);

    // Check if slug already exists
    const existingProject = await db.collection("projects").doc(slug).get();
    if (existingProject.exists) {
      return res.status(400).json({
        error: "Project with this name already exists",
      });
    }

    // Extract GitHub owner and repo from URL
    const githubMatch = projectData.githubUrl.match(
      /github\.com\/([^\/]+)\/([^\/]+)/
    );
    if (!githubMatch) {
      return res.status(400).json({
        error: "Could not parse GitHub URL",
      });
    }

    const [, owner, repo] = githubMatch;

    // Attempt ownership verification via OAuth and username match
    let ownershipVerified = false;
    let submitterGithub = null;
    let oauthVerified = false;
    try {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const udata = userSnap.data();
        submitterGithub = (udata.githubUsername || "").trim();
        const token = (udata.githubAccessToken || "").trim();
        if (token) {
          try {
            const gh = (await import("../../../services/RealGitHubService")).realGitHubService;
            oauthVerified = await gh.hasRepoPushAccess(owner, repo, token);
          } catch (_) { oauthVerified = false; }
        }
        ownershipVerified = oauthVerified || (submitterGithub && submitterGithub.toLowerCase() === owner.toLowerCase());
      }
    } catch (e) {
      ownershipVerified = false;
    }

    // Prepare project document
    const projectDoc = {
      slug,
      name: projectData.name,
      description: projectData.description,
      owner,
      repo: repo.replace(".git", ""), // Remove .git suffix if present
      ecosystem: projectData.ecosystem,
      category: projectData.category,
      contractAddress: projectData.contractAddress || null,
      deploymentTxHash: projectData.deploymentTxHash || null,
      website: projectData.website || null,
      twitter: projectData.twitter || null,
      discord: projectData.discord || null,
      teamMembers: Array.isArray(projectData.teamMembers)
        ? projectData.teamMembers.filter((member) => String(member).trim())
        : [],
      hackathons: Array.isArray(projectData.hackathons) ? projectData.hackathons : [],
      isOpenSource: Boolean(projectData.isOpenSource),
      lookingForFunding: Boolean(projectData.lookingForFunding),
      fundingAmount: projectData.fundingAmount || null,
      milestones: Array.isArray(projectData.milestones)
        ? projectData.milestones.filter((milestone) => String(milestone).trim())
        : [],
      submittedBy: userId,
      owners: [userId],
      submittedAt: new Date().toISOString(),
      status: ownershipVerified ? "submitted" : "pending_review",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false,
      featured: false,
      stats: {
        views: 0,
        stars: 0,
        forks: 0,
        commits: 0,
        issues: 0,
        pulls: 0,
        velocity: 5 + (Array.isArray(projectData.milestones) ? projectData.milestones.length : 0) * 10,
      },
    };

    // Save to Firestore
   await db.collection("projects").doc(slug).set(projectDoc);

    // Also save to ecosystem-specific collection for easier querying
    await db
      .collection(`projects_${projectData.ecosystem}`)
      .doc(slug)
      .set(projectDoc);

    // Grant the submitter edit permissions (used by the in-app editor)
    if (userId) {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() : {};
      const existingPermissions = Array.isArray(userData.permissions)
        ? userData.permissions
        : [];

      const alreadyHas = existingPermissions.some((p) => p.projectSlug === slug);
      if (!alreadyHas) {
        await userRef.set(
          {
            permissions: [
              ...existingPermissions,
              {
                projectSlug: slug,
                projectName: projectData.name,
                role: "editor",
                grantedAt: new Date().toISOString(),
              },
            ],
          },
          { merge: true }
        );
      }
    }

    // Log submission for admin review
    await db.collection("admin_queue").add({
      type: "project_submission",
      projectSlug: slug,
      ecosystem: projectData.ecosystem,
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
      status: ownershipVerified ? "info" : "pending",
      priority: projectData.ecosystem === "base" ? "high" : "normal", // Prioritize Base projects,
      note: ownershipVerified ? "ownership_verified_via_github_username_match" : "ownership_unverified"

    });

    // Send notification (you could integrate with Discord, Slack, etc.)
    await notifyAdmins(projectDoc);

    // Log to engagement feed
    await logActivity({
      type: "project_submitted",
      projectSlug: slug,
      projectName: projectData.name,
      userHandle: userId, // In a real app, you might fetch the actual username/handle
      description: `New project "${projectData.name}" was launched in the ${projectData.ecosystem} ecosystem!`,
      ecosystem: projectData.ecosystem
    });

    // Torque event — fire and forget
    if (process.env.TORQUE_API_KEY) {
      try {
        await fetch("https://ingest.torque.so/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.TORQUE_API_KEY,
          },
          body: JSON.stringify({
            eventName: "project_submitted",
            userPubkey: userId,
            timestamp: Date.now(),
            data: {
              project_name: projectData.name,
              ecosystem: projectData.ecosystem,
              category: projectData.category,
              project_slug: slug,
            },
          }),
        });
      } catch (e) {
        console.warn("[Torque] project_submitted event failed (non-blocking):", e.message);
      }
    }

    res.status(201).json({
      success: true,
      projectSlug: slug,
      message: "Project submitted successfully and is pending review",
    });
  } catch (error) {
    console.error("Error submitting project:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

export default withApiMiddleware(handler, { allowedMethods: ["POST"], rateLimit: 5, rateLimitKey: "PROJECT_SUBMIT" });

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

async function notifyAdmins(projectData) {
  try {
    // You could integrate with Discord webhook, Slack, email, etc.

    // Example Discord webhook (uncomment and configure)
    /*
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '🚀 New Project Submission',
            description: `**${projectData.name}** has been submitted to the ${projectData.ecosystem} ecosystem`,
            fields: [
              { name: 'Description', value: projectData.description.substring(0, 100) + '...', inline: false },
              { name: 'GitHub', value: `https://github.com/${projectData.owner}/${projectData.repo}`, inline: true },
              { name: 'Category', value: projectData.category, inline: true },
              { name: 'Contract', value: projectData.contractAddress, inline: true }
            ],
            color: projectData.ecosystem === 'base' ? 0x0052FF : 0x35D07F,
            timestamp: new Date().toISOString()
          }]
        })
      });
    }
    */
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}
