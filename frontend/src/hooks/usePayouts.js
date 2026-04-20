/**
 * Hook for managing campaign payouts (USDC + token allocation)
 * Integrates with Circle API for USDC transfers
 */

import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { sanitizePayout, validatePayout } from '@/schemas/tokenAllocation';

export default function usePayouts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get payouts for a campaign
   */
  const getPayoutsByCampaign = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'Payouts'),
        where('campaignId', '==', campaignId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching campaign payouts:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get payouts for a tester
   */
  const getPayoutsByTester = useCallback(async (testerId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'Payouts'),
        where('testerId', '==', testerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error('Error fetching tester payouts:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get single payout
   */
  const getPayout = useCallback(async (payoutId) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'Payouts', payoutId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Payout not found');
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (err) {
      console.error('Error fetching payout:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create payout record (USDC transfer + token allocation)
   * Triggers Circle API call server-side
   */
  const createPayout = useCallback(async (payoutData) => {
    setLoading(true);
    setError(null);
    try {
      const validation = validatePayout(payoutData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      const sanitized = sanitizePayout(payoutData);

      const dataWithTimestamps = {
        ...sanitized,
        createdAt: Timestamp.fromDate(new Date(sanitized.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(sanitized.updatedAt)),
      };

      const docRef = await addDoc(
        collection(db, 'Payouts'),
        dataWithTimestamps
      );

      // Trigger Circle API call via server-side API
      if (sanitized.usdc > 0) {
        try {
          const response = await fetch('/api/circle/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payoutId: docRef.id,
              testerId: sanitized.testerId,
              amount: sanitized.usdc,
              campaignId: sanitized.campaignId,
            }),
          });

          if (!response.ok) {
            throw new Error(`Circle API error: ${response.statusText}`);
          }

          const { transferId } = await response.json();

          // Update payout with Circle transfer ID
          await updateDoc(doc(db, 'Payouts', docRef.id), {
            circleTransferId: transferId,
            status: 'processing',
            updatedAt: Timestamp.fromDate(new Date()),
          });
        } catch (circleErr) {
          console.error('Circle API error:', circleErr);
          // Update payout with error but keep record
          await updateDoc(doc(db, 'Payouts', docRef.id), {
            status: 'failed',
            errorMessage: circleErr.message,
            updatedAt: Timestamp.fromDate(new Date()),
          });
        }
      }

      return docRef.id;
    } catch (err) {
      console.error('Error creating payout:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update payout status (admin only)
   */
  const updatePayout = useCallback(async (payoutId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'Payouts', payoutId);

      const dataWithTimestamps = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(docRef, dataWithTimestamps);
      return true;
    } catch (err) {
      console.error('Error updating payout:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark payout as completed
   */
  const completePayout = useCallback(async (payoutId, transactionHash) => {
    return updatePayout(payoutId, {
      status: 'completed',
      transactionHash: transactionHash || '',
      completedAt: Timestamp.fromDate(new Date()),
    });
  }, [updatePayout]);

  /**
   * Mark payout as failed
   */
  const failPayout = useCallback(async (payoutId, errorMessage) => {
    return updatePayout(payoutId, {
      status: 'failed',
      errorMessage: errorMessage || 'Unknown error',
    });
  }, [updatePayout]);

  /**
   * Get payout statistics for a campaign
   */
  const getPayoutStats = useCallback(async (campaignId) => {
    setLoading(true);
    setError(null);
    try {
      const payouts = await getPayoutsByCampaign(campaignId);

      const stats = {
        totalCount: payouts.length,
        totalUsdc: payouts.reduce((sum, p) => sum + (p.usdc || 0), 0),
        totalTokenPercentage: payouts.reduce((sum, p) => sum + (p.tokenPercentage || 0), 0),
        completed: payouts.filter(p => p.status === 'completed').length,
        pending: payouts.filter(p => p.status === 'pending').length,
        processing: payouts.filter(p => p.status === 'processing').length,
        failed: payouts.filter(p => p.status === 'failed').length,
      };

      return stats;
    } catch (err) {
      console.error('Error calculating payout stats:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getPayoutsByCampaign]);

  return {
    getPayoutsByCampaign,
    getPayoutsByTester,
    getPayout,
    createPayout,
    updatePayout,
    completePayout,
    failPayout,
    getPayoutStats,
    loading,
    error,
  };
}
