/**
 * Hook for managing campaign submissions
 * CRUD operations: Create, Read submissions
 * Parallel to useCampaigns, maintains single responsibility
 */

import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { sanitizeSubmission, validateCampaignSubmission } from '@/schemas/campaign';

export default function useCampaignSubmissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create new submission (draft)
   * @param {Object} submissionData - Submission data
   * @returns {string} New submission ID
   */
  const createSubmission = useCallback(async (submissionData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = validateCampaignSubmission(submissionData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      const sanitized = sanitizeSubmission(submissionData);

      const dataWithTimestamps = {
        ...sanitized,
        createdAt: Timestamp.fromDate(new Date(sanitized.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(sanitized.updatedAt)),
        submittedAt: sanitized.submittedAt ? Timestamp.fromDate(new Date(sanitized.submittedAt)) : null,
      };

      const docRef = await addDoc(
        collection(db, 'CampaignSubmissions'),
        dataWithTimestamps
      );

      return docRef.id;
    } catch (err) {
      console.error('Error creating submission:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get submission by ID
   * @param {string} submissionId - Submission document ID
   * @returns {Object} Submission object or null
   */
  const getSubmission = useCallback(async (submissionId) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'CampaignSubmissions', submissionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Submission not found');
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all submissions for a campaign
   * @param {string} campaignId - Campaign ID
   * @param {string} statusFilter - Optional: 'submitted', 'approved', 'rejected'
   * @returns {Array} Submission objects
   */
  const getSubmissionsByCampaign = useCallback(async (campaignId, statusFilter = null) => {
    setLoading(true);
    setError(null);
    try {
      let constraints = [where('campaignId', '==', campaignId)];

      if (statusFilter) {
        constraints.push(where('status', '==', statusFilter));
      }

      constraints.push(orderBy('submittedAt', 'desc'));

      const q = query(collection(db, 'CampaignSubmissions'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all submissions by a tester
   * @param {string} testerId - Tester UID
   * @param {string} statusFilter - Optional filter
   * @returns {Array} Submission objects
   */
  const getSubmissionsByTester = useCallback(async (testerId, statusFilter = null) => {
    setLoading(true);
    setError(null);
    try {
      let constraints = [where('testerId', '==', testerId)];

      if (statusFilter) {
        constraints.push(where('status', '==', statusFilter));
      }

      constraints.push(orderBy('submittedAt', 'desc'));

      const q = query(collection(db, 'CampaignSubmissions'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update submission status and add approval notes
   * @param {string} submissionId - Submission document ID
   * @param {string} status - 'approved' or 'rejected'
   * @param {string} approvalNotes - Admin feedback
   * @returns {boolean} Success status
   */
  const approveSubmission = useCallback(async (submissionId, status, approvalNotes = '') => {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error('Status must be approved or rejected');
    }

    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'CampaignSubmissions', submissionId);

      await updateDoc(docRef, {
        status,
        approvalNotes,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      // Share to Farcaster if approved
      if (status === 'approved') {
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const submissionData = docSnap.data();
            
            // Fetch user FID for notifications
            let userFid = null;
            if (submissionData.testerId) {
              const userSnap = await getDoc(doc(db, 'users', submissionData.testerId));
              if (userSnap.exists()) {
                userFid = userSnap.data().farcasterFid;
              }
            }

            const { socialSharingService } = await import('@/services/SocialSharingService');
            // Attempt to get project slug from campaign or submission
            const projectSlug = submissionData.projectSlug || submissionData.campaignId;
            await socialSharingService.shareVerifiedMilestone(projectSlug, {
              title: submissionData.title || 'New Progress',
            }, userFid);
          }
        } catch (shareError) {
          console.warn('Failed to share verified milestone:', shareError);
        }
      }

      return true;
    } catch (err) {
      console.error('Error approving submission:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update submission (before final submit)
   * @param {string} submissionId - Submission document ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateSubmission = useCallback(async (submissionId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'CampaignSubmissions', submissionId);

      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return true;
    } catch (err) {
      console.error('Error updating submission:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get average rating for a campaign
   * @param {string} campaignId - Campaign ID
   * @returns {number} Average rating (0-5)
   */
  const getAverageRating = useCallback(async (campaignId) => {
    try {
      const submissions = await getSubmissionsByCampaign(campaignId, 'approved');

      if (submissions.length === 0) return 0;

      const sum = submissions.reduce((acc, sub) => acc + (sub.results?.overallRating || 0), 0);
      return Math.round((sum / submissions.length) * 10) / 10;
    } catch (err) {
      console.error('Error calculating average rating:', err);
      return 0;
    }
  }, [getSubmissionsByCampaign]);

  return {
    createSubmission,
    getSubmission,
    getSubmissionsByCampaign,
    getSubmissionsByTester,
    updateSubmission,
    approveSubmission,
    getAverageRating,
    loading,
    error,
  };
}
