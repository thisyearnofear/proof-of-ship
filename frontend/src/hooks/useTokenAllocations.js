/**
 * Hook for managing token allocations and vesting schedules
 * CRUD operations for equity tracking and payout management
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { sanitizeTokenAllocation, validateTokenAllocation } from '@/schemas/tokenAllocation';

export default function useTokenAllocations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all token allocations (admin only)
   */
  const getAllAllocations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const constraints = [];

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.campaignId) {
        constraints.push(where('campaignId', '==', filters.campaignId));
      }
      if (filters.testerId) {
        constraints.push(where('testerId', '==', filters.testerId));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = constraints.length > 0
        ? query(collection(db, 'TokenAllocations'), ...constraints)
        : collection(db, 'TokenAllocations');

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching allocations:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get allocations for a specific campaign
   */
  const getAllocationsByCampaign = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'TokenAllocations'),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching campaign allocations:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get allocations for a specific tester
   */
  const getAllocationsByTester = useCallback(async (testerId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'TokenAllocations'),
        where('testerId', '==', testerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching tester allocations:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get single allocation
   */
  const getAllocation = useCallback(async (allocationId) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'TokenAllocations', allocationId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Allocation not found');
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (err) {
      console.error('Error fetching allocation:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create token allocation (offer to tester)
   */
  const createAllocation = useCallback(async (allocationData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = validateTokenAllocation(allocationData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      const sanitized = sanitizeTokenAllocation(allocationData);

      const dataWithTimestamps = {
        ...sanitized,
        createdAt: Timestamp.fromDate(new Date(sanitized.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(sanitized.updatedAt)),
      };

      const docRef = await addDoc(
        collection(db, 'TokenAllocations'),
        dataWithTimestamps
      );

      return docRef.id;
    } catch (err) {
      console.error('Error creating allocation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update allocation (admin only)
   */
  const updateAllocation = useCallback(async (allocationId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'TokenAllocations', allocationId);

      const dataWithTimestamps = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(docRef, dataWithTimestamps);
      return true;
    } catch (err) {
      console.error('Error updating allocation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Accept allocation offer (tester accepts equity)
   */
  const acceptAllocation = useCallback(async (allocationId) => {
    return updateAllocation(allocationId, {
      status: 'accepted',
      acceptedAt: Timestamp.fromDate(new Date()),
    });
  }, [updateAllocation]);

  /**
   * Reject allocation offer (tester declines equity)
   */
  const rejectAllocation = useCallback(async (allocationId) => {
    return updateAllocation(allocationId, {
      status: 'rejected',
    });
  }, [updateAllocation]);

  /**
   * Start vesting (move to vesting status)
   */
  const startVesting = useCallback(async (allocationId) => {
    return updateAllocation(allocationId, {
      status: 'vesting',
      vestingStartedAt: Timestamp.fromDate(new Date()),
    });
  }, [updateAllocation]);

  return {
    getAllAllocations,
    getAllocationsByCampaign,
    getAllocationsByTester,
    getAllocation,
    createAllocation,
    updateAllocation,
    acceptAllocation,
    rejectAllocation,
    startVesting,
    loading,
    error,
  };
}
