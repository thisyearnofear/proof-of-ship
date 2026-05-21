/**
 * SubmissionService
 *
 * Handles project submission: validation, slug generation, Firestore write,
 * and admin queue logging.
 *
 * Extracted from DataService.ts for separation of concerns.
 */

import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/config/collections';
import { createProjectDocument, generateProjectSlug, validateProjectInput } from '@/lib/projects/projectNormalize';
import type { Project } from './DataService';
import { clearProjectCache } from './ProjectDataService';

export async function submitProject(inputData: {
  name: string;
  description: string;
  githubUrl: string;
  ecosystem: string;
  category?: string;
  [key: string]: any;
}): Promise<{ success: boolean; projectSlug?: string; error?: string }> {
  const { auth: firebaseAuth } = await import('@/lib/firebase/clientApp');
  const user = firebaseAuth.currentUser;

  if (!user) {
    return { success: false, error: 'You must be logged in to submit a project' };
  }

  try {
    const validation = validateProjectInput(inputData);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    const slug = generateProjectSlug(inputData.name);
    const existingProject = await getDoc(doc(db, 'projects', slug));
    if (existingProject.exists()) {
      return { success: false, error: 'Project with this name already exists' };
    }

    const githubMatch = inputData.githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!githubMatch) {
      return { success: false, error: 'Could not parse GitHub URL' };
    }

    const now = new Date().toISOString();

    const projectDoc: Project = {
      ...(createProjectDocument(inputData, user.uid, { slug, createdAt: now, submittedAt: now }) as Project),
      bagsTokenAddress: inputData.bagsTokenAddress || null,
    };

    await setDoc(doc(db, COLLECTIONS.PROJECTS, slug), projectDoc as any);

    await addDoc(collection(db, COLLECTIONS.ADMIN_QUEUE), {
      type: 'project_submission',
      projectSlug: slug,
      ecosystem: inputData.ecosystem,
      submittedBy: user.uid,
      submittedAt: now,
      status: 'pending',
      priority: inputData.ecosystem === 'base' ? 'high' : 'normal',
    });

    clearProjectCache();
    return { success: true, projectSlug: slug };
  } catch (error: any) {
    console.error('Error submitting project:', error);
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Please make sure you are logged in.' };
    }
    return { success: false, error: error.message || 'Failed to submit project' };
  }
}
