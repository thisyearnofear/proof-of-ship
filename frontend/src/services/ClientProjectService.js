/**
 * Client-side project submission service
 * Works directly with Firestore for static deployments (Firebase Hosting on Spark plan)
 */

import { db, auth } from '../lib/firebase/clientApp';
import { collection, doc, setDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Submit a new project directly to Firestore
 * @param {Object} projectData - The project data to submit
 * @returns {Promise<{success: boolean, projectSlug?: string, error?: string}>}
 */
export async function submitProject(projectData) {
  const user = auth.currentUser;
  
  if (!user) {
    return { success: false, error: 'You must be logged in to submit a project' };
  }

  try {
    // Validate required fields
    const requiredFields = ['name', 'description', 'githubUrl', 'ecosystem', 'category', 'contractAddress'];
    const missingFields = requiredFields.filter(field => !projectData[field]);
    
    if (missingFields.length > 0) {
      return { success: false, error: `Missing required fields: ${missingFields.join(', ')}` };
    }

    // Validate GitHub URL
    if (!projectData.githubUrl.includes('github.com')) {
      return { success: false, error: 'Invalid GitHub URL' };
    }

    // Validate contract address
    if (!projectData.contractAddress.startsWith('0x')) {
      return { success: false, error: 'Invalid contract address format' };
    }

    // Generate project slug
    const slug = generateSlug(projectData.name);

    // Check if slug already exists
    const existingProject = await getDoc(doc(db, 'projects', slug));
    if (existingProject.exists()) {
      return { success: false, error: 'Project with this name already exists' };
    }

    // Extract GitHub owner and repo from URL
    const githubMatch = projectData.githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!githubMatch) {
      return { success: false, error: 'Could not parse GitHub URL' };
    }

    const [, owner, repo] = githubMatch;

    // Prepare project document
    const now = new Date().toISOString();
    const projectDoc = {
      slug,
      name: projectData.name,
      description: projectData.description,
      owner,
      repo: repo.replace('.git', ''),
      ecosystem: projectData.ecosystem,
      category: projectData.category,
      contractAddress: projectData.contractAddress,
      deploymentTxHash: projectData.deploymentTxHash || null,
      website: projectData.website || null,
      twitter: projectData.twitter || null,
      discord: projectData.discord || null,
      teamMembers: Array.isArray(projectData.teamMembers)
        ? projectData.teamMembers.filter(member => String(member).trim())
        : [],
      hackathons: Array.isArray(projectData.hackathons) ? projectData.hackathons : [],
      isOpenSource: Boolean(projectData.isOpenSource),
      lookingForFunding: Boolean(projectData.lookingForFunding),
      fundingAmount: projectData.fundingAmount || null,
      milestones: Array.isArray(projectData.milestones)
        ? projectData.milestones.filter(milestone => String(milestone).trim())
        : [],
      submittedBy: user.uid,
      owners: [user.uid],
      submittedAt: now,
      status: 'pending_review',
      createdAt: now,
      updatedAt: now,
      verified: false,
      featured: false,
      isPublic: true, // Make projects publicly readable by default
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
    await setDoc(doc(db, 'projects', slug), projectDoc);

    // Also save to ecosystem-specific collection
    await setDoc(doc(db, `projects_${projectData.ecosystem}`, slug), projectDoc);

    // Log to admin queue
    await addDoc(collection(db, 'admin_queue'), {
      type: 'project_submission',
      projectSlug: slug,
      ecosystem: projectData.ecosystem,
      submittedBy: user.uid,
      submittedAt: now,
      status: 'pending',
      priority: projectData.ecosystem === 'base' ? 'high' : 'normal',
    });

    return {
      success: true,
      projectSlug: slug,
      message: 'Project submitted successfully',
    };
  } catch (error) {
    console.error('Error submitting project:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Please make sure you are logged in.' };
    }
    
    return { success: false, error: error.message || 'Failed to submit project' };
  }
}

/**
 * Get evidence for a project (PRs and other activity)
 * @param {string} projectSlug - The project slug
 * @returns {Promise<Array>}
 */
export async function getProjectEvidence(projectSlug) {
  try {
    const projectDoc = await getDoc(doc(db, 'projects', projectSlug));
    if (!projectDoc.exists()) return [];

    const project = projectDoc.data();
    const { owner, repo } = project;

    if (!owner || !repo) return [];

    // In a real app, we would call the GitHub API here.
    // Since we're in a client service, we might call an API route or use a GitHub service.
    // For now, we'll return some mock data or attempt to fetch from an API if available.
    
    // Assuming there's an API route /api/projects/[slug]/evidence
    const response = await fetch(`/api/projects/${projectSlug}/evidence`);
    if (response.ok) {
      const data = await response.json();
      return data.evidence || [];
    }

    return [];
  } catch (error) {
    console.error('Error fetching project evidence:', error);
    return [];
  }
}

export default {
  submitProject,
  getProjectEvidence,
};
