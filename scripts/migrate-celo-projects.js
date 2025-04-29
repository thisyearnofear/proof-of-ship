/**
 * This script migrates projects from celoProjects.js to Firestore
 *
 * To run:
 * 1. Set up your Firebase credentials in .env.local
 * 2. Run: node scripts/migrate-celo-projects.js
 */

require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function migrateProjects() {
  try {
    // Read the celoProjects.js file
    const celoProjectsPath = path.join(
      __dirname,
      "../src/constants/celoProjects.js"
    );
    const fileContent = fs.readFileSync(celoProjectsPath, "utf8");

    // Extract the projects array using regex
    const projectsMatch = fileContent.match(
      /export const celoProjects = \[([\s\S]*?)\];/
    );
    if (!projectsMatch) {
      throw new Error("Could not find celoProjects array in the file");
    }

    // Convert the string to a valid JSON array
    const projectsString = `[${projectsMatch[1]}]`;
    let sanitizedString = projectsString
      .replace(/\/\/ .*$/gm, "") // Remove comments
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .replace(/(\w+):/g, '"$1":') // Wrap keys in quotes
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/"https":/g, "https:") // Fix double-quoted URLs
      .replace(/"http":/g, "http:"); // Fix double-quoted URLs

    // Additional fix for URLs
    sanitizedString = sanitizedString.replace(
      /:\s*"(https?:\/\/[^"]+)"/g,
      ': "$1"'
    );

    console.log("Attempting to parse JSON...");

    // Parse the JSON
    let projects;
    try {
      projects = JSON.parse(sanitizedString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      console.log("Sanitized string:", sanitizedString);

      // Let's try a more direct approach - manually extract the projects
      console.log("Trying alternative approach...");

      // Read the original celoProjects.js file
      const celoProjectsContent = fs.readFileSync(
        path.join(__dirname, "../src/constants/celoProjects.js"),
        "utf8"
      );

      // Require the file directly
      const tempFilePath = path.join(__dirname, "temp-projects.js");
      fs.writeFileSync(
        tempFilePath,
        `const celoProjects = ${projectsMatch[1]};\nmodule.exports = celoProjects;`
      );

      try {
        projects = require(tempFilePath);
        fs.unlinkSync(tempFilePath); // Clean up temp file
      } catch (requireError) {
        console.error("Error requiring projects:", requireError);
        throw requireError;
      }
    }

    console.log(`Found ${projects.length} projects to migrate`);

    // Batch write to Firestore
    const batch = db.batch();

    for (const project of projects) {
      // Generate a slug from the project name if not available
      const slug =
        project.slug || project.name.toLowerCase().replace(/\s+/g, "-");

      const projectRef = db.collection("projects").doc(slug);
      batch.set(projectRef, {
        name: project.name,
        slug: slug,
        description: project.description || "",
        contracts: project.contracts || [],
        socials: project.socials || {},
        founders: project.founders || [],
        season: project.season || null,
        owners: [], // Will be populated later
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Added project ${project.name} to batch`);
    }

    // Commit the batch
    await batch.commit();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
migrateProjects()
  .then(() => {
    console.log("Script execution completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Script execution failed:", err);
    process.exit(1);
  });
