import { db, auth } from "../../../lib/firebase/serverOnly";
import { verifyAuth, withApiMiddleware } from "../../../utils/apiMiddleware";
import { logActivity } from "../../../utils/activityLogger";
import { createProjectDocument, generateProjectSlug, validateProjectInput } from "../../../lib/projects/projectNormalize";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await verifyAuth(req, auth);

    const projectData = { ...(req.body || {}) };

    const validation = validateProjectInput(projectData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.errors[0],
        errors: validation.errors,
      });
    }

    if (projectData.githubUrl) {
      const dupeSnap = await db.collection("projects")
        .where("githubUrl", "==", projectData.githubUrl)
        .limit(1)
        .get();
      if (!dupeSnap.empty) {
        const dupe = dupeSnap.docs[0].data();
        return res.status(409).json({
          error: "A project with this GitHub URL already exists",
          slug: dupe.slug,
          existingProject: {
            name: dupe.name,
            slug: dupe.slug,
            ecosystem: dupe.ecosystem,
            isOwner: dupe.owners && dupe.owners.includes(userId),
            owners: dupe.owners,
            submittedBy: dupe.submittedBy
          }
        });
      }
    }

    const slug = generateProjectSlug(projectData.name);
    console.log("Checking project slug:", slug);

    const existingProject = await db.collection("projects").doc(slug).get();
    if (existingProject.exists) {
      const existingData = existingProject.data();
      const isOwner = existingData.owners && existingData.owners.includes(userId);
      console.log("Existing project found at slug:", slug, "isOwner:", isOwner);
      return res.status(409).json({
        error: "Project with this name already exists",
        slug,
        existingProject: {
          name: existingData.name,
          slug: existingData.slug,
          ecosystem: existingData.ecosystem,
          isOwner,
          owners: existingData.owners,
          submittedBy: existingData.submittedBy
        }
      });
    }

    const githubMatch = projectData.githubUrl.match(
      /github\.com\/([^\/]+)\/([^\/]+)/
    );
    if (!githubMatch) {
      return res.status(400).json({
        error: "Could not parse GitHub URL",
      });
    }

    const [, owner, repo] = githubMatch;

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

    if (projectData.accentColor) {
      const { ACCENT_COLORS } = await import('../../../lib/projects/projectNormalize');
      const valid = ACCENT_COLORS.some(c => c.value === projectData.accentColor);
      if (!valid) projectData.accentColor = null;
    }

    const projectDoc = createProjectDocument(projectData, userId, {
      slug,
      status: ownershipVerified ? "submitted" : "pending_review"
    });

    await db.runTransaction(async (transaction) => {
      transaction.set(db.collection("projects").doc(slug), projectDoc);

      if (userId) {
        const userRef = db.collection("users").doc(userId);
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.exists ? userSnap.data() : {};
        const existingPermissions = Array.isArray(userData.permissions)
          ? userData.permissions
          : [];

        const alreadyHas = existingPermissions.some((p) => p.projectSlug === slug);
        if (!alreadyHas) {
          transaction.set(
            userRef,
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
    });

    await db.collection("admin_queue").add({
      type: "project_submission",
      projectSlug: slug,
      ecosystem: projectData.ecosystem,
      submittedBy: userId,
      submittedAt: new Date().toISOString(),
      status: ownershipVerified ? "info" : "pending",
      priority: projectData.ecosystem === "base" ? "high" : "normal",
      note: ownershipVerified ? "ownership_verified_via_github_username_match" : "ownership_unverified"
    });

    await notifyAdmins(projectDoc);

    await logActivity({
      type: "project_submitted",
      projectSlug: slug,
      projectName: projectData.name,
      userHandle: userId,
      description: `New project "${projectData.name}" was launched in the ${projectData.ecosystem} ecosystem!`,
      ecosystem: projectData.ecosystem
    });

    // Broadcast the new project to Farcaster (top-of-funnel viral moment).
    // Non-blocking — failure to cast must not affect project creation.
    try {
      const { socialSharingService } = await import("../../../services/SocialSharingService");
      socialSharingService.shareNewProject({
        slug,
        name: projectData.name,
        description: projectData.description || "",
        ecosystem: projectData.ecosystem,
      });
    } catch (e) {
      console.warn("[Share] shareNewProject failed (non-blocking):", e.message);
    }

    if (process.env.TORQUE_API_KEY) {
      try {
        await fetch("https://ingest.torque.so/events", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": process.env.TORQUE_API_KEY },
          body: JSON.stringify({
            eventName: "project_submitted",
            userPubkey: userId,
            timestamp: Date.now(),
            data: { project_name: projectData.name, ecosystem: projectData.ecosystem, category: projectData.category, project_slug: slug },
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

async function notifyAdmins(projectData) {
  try {
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

export default withApiMiddleware(handler, { allowedMethods: ["POST"], rateLimit: 5, rateLimitKey: "PROJECT_SUBMIT" });
