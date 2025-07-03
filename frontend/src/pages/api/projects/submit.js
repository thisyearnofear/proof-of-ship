import { db } from "../../../lib/firebase/adminApp";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const projectData = req.body;

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "githubUrl",
      "ecosystem",
      "category",
      "contractAddress",
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

    // Validate contract address
    if (!projectData.contractAddress.startsWith("0x")) {
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

    // Prepare project document
    const projectDoc = {
      slug,
      name: projectData.name,
      description: projectData.description,
      owner,
      repo: repo.replace(".git", ""), // Remove .git suffix if present
      ecosystem: projectData.ecosystem,
      category: projectData.category,
      contractAddress: projectData.contractAddress,
      deploymentTxHash: projectData.deploymentTxHash || null,
      website: projectData.website || null,
      twitter: projectData.twitter || null,
      discord: projectData.discord || null,
      teamMembers: projectData.teamMembers.filter((member) => member.trim()),
      isOpenSource: projectData.isOpenSource,
      lookingForFunding: projectData.lookingForFunding,
      fundingAmount: projectData.fundingAmount || null,
      milestones: projectData.milestones.filter((milestone) =>
        milestone.trim()
      ),
      submittedBy: projectData.submittedBy,
      submittedAt: projectData.submittedAt,
      status: "pending_review",
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
      },
    };

    // Save to Firestore
    await db.collection("projects").doc(slug).set(projectDoc);

    // Also save to ecosystem-specific collection for easier querying
    await db
      .collection(`projects_${projectData.ecosystem}`)
      .doc(slug)
      .set(projectDoc);

    // Log submission for admin review
    await db.collection("admin_queue").add({
      type: "project_submission",
      projectSlug: slug,
      ecosystem: projectData.ecosystem,
      submittedBy: projectData.submittedBy,
      submittedAt: projectData.submittedAt,
      status: "pending",
      priority: projectData.ecosystem === "base" ? "high" : "normal", // Prioritize Base projects
    });

    // Send notification (you could integrate with Discord, Slack, etc.)
    await notifyAdmins(projectDoc);

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
    console.log("New project submission:", {
      name: projectData.name,
      ecosystem: projectData.ecosystem,
      submittedAt: projectData.submittedAt,
    });

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
