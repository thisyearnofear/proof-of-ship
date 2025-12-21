/**
 * Hook for managing testing campaigns
 * CRUD operations: Create, Read, Update, Delete campaigns
 */

import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase'; // Adjust path as needed
import { sanitizeCampaign, validateCampaign } from '@/schemas/campaign';

export default function useCampaigns() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all campaigns with optional filters
   * @param {Object} filters - { status, projectId, creatorId, sortBy }
   * @returns {Array} Array of campaign objects
   */
  const getCampaigns = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let q = collection(db, 'TestingCampaigns');
      const constraints = [];

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.projectId) {
        constraints.push(where('projectId', '==', filters.projectId));
      }
      if (filters.creatorId) {
        constraints.push(where('creatorId', '==', filters.creatorId));
      }

      // Default sort by deadline ascending (soonest first)
      const sortField = filters.sortBy || 'deadline';
      constraints.push(orderBy(sortField, 'asc'));

      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      const queryConstraints = constraints.length > 0 ? query(q, ...constraints) : q;
      const snapshot = await getDocs(queryConstraints);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get single campaign by ID
   * @param {string} campaignId - Campaign document ID
   * @returns {Object} Campaign object or null
   */
  const getCampaign = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'TestingCampaigns', campaignId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Campaign not found');
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new campaign
   * @param {Object} campaignData - Campaign data to save
   * @returns {string} New campaign ID
   */
  const createCampaign = useCallback(async (campaignData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = validateCampaign(campaignData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      const sanitized = sanitizeCampaign(campaignData);

      // Convert dates to Firestore Timestamp
      const dataWithTimestamps = {
        ...sanitized,
        deadline: Timestamp.fromDate(new Date(sanitized.deadline)),
        createdAt: Timestamp.fromDate(new Date(sanitized.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(sanitized.updatedAt)),
      };

      const docRef = await addDoc(
        collection(db, 'TestingCampaigns'),
        dataWithTimestamps
      );

      return docRef.id;
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update existing campaign
   * @param {string} campaignId - Campaign document ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success status
   */
  const updateCampaign = useCallback(async (campaignId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'TestingCampaigns', campaignId);

      // Validate if full data provided
      if (updates.title || updates.description) {
        const campaignDoc = await getDoc(docRef);
        const validation = validateCampaign({
          ...campaignDoc.data(),
          ...updates,
        });

        if (!validation.isValid) {
          throw new Error(validation.errors.join('; '));
        }
      }

      const dataWithTimestamps = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (updates.deadline) {
        dataWithTimestamps.deadline = Timestamp.fromDate(new Date(updates.deadline));
      }

      await updateDoc(docRef, dataWithTimestamps);
      return true;
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Publish campaign (change status from draft to open)
   * @param {string} campaignId - Campaign document ID
   * @returns {boolean} Success status
   */
  const publishCampaign = useCallback(async (campaignId) => {
    return updateCampaign(campaignId, {
      status: 'open',
      updatedAt: new Date().toISOString(),
    });
  }, [updateCampaign]);

  /**
   * Close campaign (stop accepting submissions)
   * @param {string} campaignId - Campaign document ID
   * @returns {boolean} Success status
   */
  const closeCampaign = useCallback(async (campaignId) => {
    return updateCampaign(campaignId, {
      status: 'closed',
      updatedAt: new Date().toISOString(),
    });
  }, [updateCampaign]);

  /**
   * Move campaign to review (before approval)
   * @param {string} campaignId - Campaign document ID
   * @returns {boolean} Success status
   */
  const requestReview = useCallback(async (campaignId) => {
    return updateCampaign(campaignId, {
      status: 'review',
      updatedAt: new Date().toISOString(),
    });
  }, [updateCampaign]);

  /**
   * Delete campaign (only if draft)
   * @param {string} campaignId - Campaign document ID
   * @returns {boolean} Success status
   */
  const deleteCampaign = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'TestingCampaigns', campaignId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Campaign not found');
      }

      if (docSnap.data().status !== 'draft') {
        throw new Error('Can only delete draft campaigns');
      }

      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update campaign stats (called when submissions are approved)
   * @param {string} campaignId - Campaign document ID
   * @param {Object} stats - { totalSubmissions, approvedSubmissions, averageRating }
   */
  const updateStats = useCallback(async (campaignId, stats) => {
    return updateCampaign(campaignId, {
      stats,
    });
  }, [updateCampaign]);

  return {
    getCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    publishCampaign,
    closeCampaign,
    requestReview,
    deleteCampaign,
    updateStats,
    loading,
    error,
  };
}
