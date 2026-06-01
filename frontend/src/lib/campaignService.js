/**
 * Campaign Service
 * Handles all campaign and submission operations with Firestore
 * 
 * Core Principles:
 * - DRY: Single source of truth for all campaign/submission logic
 * - PERFORMANT: Caching and batch operations
 * - CLEAN: Clear separation of read/write operations
 */

import { collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, orderBy, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { sanitizeCampaign, sanitizeSubmission, validateCampaign, validateSubmission } from '@/schemas/campaign';

class CampaignService {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all campaigns for a project
   */
  async getProjectCampaigns(projectId, options = {}) {
    try {
      const cacheKey = `campaigns:${projectId}`;
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      const q = query(
        collection(this.db, 'campaigns'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.cache.set(cacheKey, { data: campaigns, timestamp: Date.now() });
      return campaigns;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  /**
   * Get active campaigns (for testers to discover)
   */
  async getActiveCampaigns(options = {}) {
    try {
      const cacheKey = 'campaigns:active';
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      const now = new Date().toISOString();
      const q = query(
        collection(this.db, 'campaigns'),
        where('status', '==', 'active'),
        where('startDate', '<=', now),
        where('endDate', '>=', now),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const campaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.cache.set(cacheKey, { data: campaigns, timestamp: Date.now() });
      return campaigns;
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      return [];
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId) {
    try {
      const cacheKey = `campaign:${campaignId}`;
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      const snap = await getDoc(doc(this.db, 'campaigns', campaignId));
      if (!snap.exists) return null;

      const campaign = { id: snap.id, ...snap.data() };
      this.cache.set(cacheKey, { data: campaign, timestamp: Date.now() });
      return campaign;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  /**
   * Create new campaign
   */
  async createCampaign(campaignData) {
    try {
      const validation = validateCampaign(campaignData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitized = sanitizeCampaign(campaignData);
      const docRef = await addDoc(collection(this.db, 'campaigns'), sanitized);
      
      // Clear cache
      this.clearCachePattern(`campaigns:${campaignData.projectId}`);
      this.clearCachePattern('campaigns:active');

      return { id: docRef.id, ...sanitized };
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId, updates) {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) throw new Error('Campaign not found');

      const merged = { ...campaign, ...updates, id: campaignId };
      const validation = validateCampaign(merged);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitized = sanitizeCampaign(merged);
      await updateDoc(doc(this.db, 'campaigns', campaignId), sanitized);

      // Clear caches
      this.clearCachePattern(`campaign:${campaignId}`);
      this.clearCachePattern(`campaigns:${campaign.projectId}`);
      this.clearCachePattern('campaigns:active');

      return { id: campaignId, ...sanitized };
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Get submissions for a campaign
   */
  async getCampaignSubmissions(campaignId) {
    try {
      const cacheKey = `submissions:${campaignId}`;
      if (this.cache.has(cacheKey)) {
        const { data, timestamp } = this.cache.get(cacheKey);
        if (Date.now() - timestamp < this.cacheTTL) {
          return data;
        }
      }

      const q = query(
        collection(this.db, 'submissions'),
        where('campaignId', '==', campaignId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      this.cache.set(cacheKey, { data: submissions, timestamp: Date.now() });
      return submissions;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  }

  /**
   * Get tester's submissions
   */
  async getTesterSubmissions(testerId) {
    try {
      const q = query(
        collection(this.db, 'submissions'),
        where('testerId', '==', testerId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching tester submissions:', error);
      return [];
    }
  }

  /**
   * Submit to campaign
   */
  async submitToCampaign(campaignId, testerId, submissionData) {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) throw new Error('Campaign not found');

      // Check if campaign is still open
      const now = new Date().toISOString();
      if (campaign.status !== 'active' || new Date(campaign.endDate) < new Date(now)) {
        throw new Error('Campaign is not accepting submissions');
      }

      const submission = {
        ...submissionData,
        campaignId,
        testerId,
        id: `${campaignId}:${testerId}:${Date.now()}`,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };

      const validation = validateSubmission(submission);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const sanitized = sanitizeSubmission(submission);
      const docRef = await addDoc(collection(this.db, 'submissions'), sanitized);

      // Increment submission count
      await updateDoc(doc(this.db, 'campaigns', campaignId), {
        submissionCount: (campaign.submissionCount || 0) + 1
      });

      this.clearCachePattern(`submissions:${campaignId}`);

      return { id: docRef.id, ...sanitized };
    } catch (error) {
      console.error('Error submitting to campaign:', error);
      throw error;
    }
  }

  /**
   * Review submission (admin only)
   */
  async reviewSubmission(submissionId, reviewData) {
    try {
      const submission = {
        status: reviewData.status, // 'accepted' or 'rejected'
        qualityScore: reviewData.qualityScore,
        feedback: reviewData.feedback,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewData.reviewedBy
      };

      const snap = await getDoc(doc(this.db, 'submissions', submissionId));
      if (!snap.exists) throw new Error('Submission not found');

      const existing = snap.data();
      const merged = { ...existing, ...submission };

      const validation = validateSubmission(merged);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      await updateDoc(doc(this.db, 'submissions', submissionId), submission);

      this.clearCachePattern(`submissions:${existing.campaignId}`);

      return { id: submissionId, ...submission };
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw error;
    }
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(campaignId) {
    try {
      const submissions = await this.getCampaignSubmissions(campaignId);
      
      const stats = {
        totalSubmissions: submissions.length,
        acceptedCount: submissions.filter(s => s.status === 'accepted').length,
        rejectedCount: submissions.filter(s => s.status === 'rejected').length,
        underReviewCount: submissions.filter(s => s.status === 'under_review').length,
        avgQualityScore: submissions.filter(s => s.qualityScore).length > 0
          ? submissions.filter(s => s.qualityScore).reduce((sum, s) => sum + s.qualityScore, 0) / submissions.filter(s => s.qualityScore).length
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Error calculating campaign stats:', error);
      return {};
    }
  }

  /**
   * Cache management
   */
  clearCache(key) {
    this.cache.delete(key);
  }

  clearCachePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clearAllCache() {
    this.cache.clear();
  }
}

export default CampaignService;
