/**
 * Admin Submissions Review Page
 * Review and approve/reject campaign submissions
 * 
 * Uses:
 * - useCampaignSubmissions for data
 * - SubmissionReview for review UI
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/stores/authStore';
import useCampaigns from '@/hooks/useCampaigns';
import useCampaignSubmissions from '@/hooks/useCampaignSubmissions';
import { Card } from '@/components/common/Card';
import { SubmissionReview } from '@/components/admin';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import {
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { getCampaigns } = useCampaigns();
  const { getSubmissionsByCampaign, approveSubmission, loading } = useCampaignSubmissions();

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Check admin access
  useEffect(() => {
    if (currentUser === false) {
      router.push('/login?redirectTo=/admin/submissions');
    }
    // TODO: Add proper admin role check
    if (currentUser && !currentUser.email?.includes('@')) {
      router.push('/');
    }
  }, [currentUser, router]);

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      setLoadingData(true);
      try {
        const camps = await getCampaigns();
        setCampaigns(camps || []);
        if (camps && camps.length > 0) {
          setSelectedCampaignId(camps[0].id);
        }
      } catch (err) {
        console.error('Failed to load campaigns:', err);
      } finally {
        setLoadingData(false);
      }
    };

    if (currentUser) {
      loadCampaigns();
    }
  }, [currentUser, getCampaigns]);

  // Load submissions for selected campaign
  useEffect(() => {
    if (!selectedCampaignId) return;

    const loadSubmissions = async () => {
      try {
        const subs = await getSubmissionsByCampaign(selectedCampaignId, 'submitted');
        setSubmissions(subs || []);
        if (subs && subs.length > 0) {
          setSelectedSubmissionId(subs[0].id);
        } else {
          setSelectedSubmissionId(null);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      }
    };

    loadSubmissions();
  }, [selectedCampaignId, getSubmissionsByCampaign]);

  const handleApprove = async (submissionId, notes = '') => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await approveSubmission(submissionId, 'approved', notes);
      
      setActionSuccess('Submission approved!');
      
      // Reload submissions
      const subs = await getSubmissionsByCampaign(selectedCampaignId, 'submitted');
      setSubmissions(subs || []);
      
      if (subs && subs.length > 0) {
        setSelectedSubmissionId(subs[0].id);
      } else {
        setSelectedSubmissionId(null);
      }

      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to approve:', err);
      setActionError(err.message || 'Failed to approve submission');
    }
  };

  const handleReject = async (submissionId, notes = '') => {
    setActionError(null);
    setActionSuccess(null);

    try {
      await approveSubmission(submissionId, 'rejected', notes);
      
      setActionSuccess('Submission rejected');
      
      // Reload submissions
      const subs = await getSubmissionsByCampaign(selectedCampaignId, 'submitted');
      setSubmissions(subs || []);
      
      if (subs && subs.length > 0) {
        setSelectedSubmissionId(subs[0].id);
      } else {
        setSelectedSubmissionId(null);
      }

      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to reject:', err);
      setActionError(err.message || 'Failed to reject submission');
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);

  if (currentUser === null) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Review Submissions</title>
      </Head>

      <div className="min-h-screen bg-surface-secondary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Review Submissions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Approve or reject testing submissions
            </p>
          </div>

          {/* Messages */}
          {actionSuccess && (
            <Card className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex gap-3">
                <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-green-800 dark:text-green-300">{actionSuccess}</p>
              </div>
            </Card>
          )}

          {actionError && (
            <Card className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-300">{actionError}</p>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {loadingData ? (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="p-12 text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">No Campaigns</h3>
              <p className="text-gray-600 dark:text-gray-400">No campaigns available to review</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Campaign List */}
              <div className="lg:col-span-1">
                <Card className="p-4">
                  <h3 className="font-semibold text-primary mb-3">Campaigns</h3>
                  <div className="space-y-2">
                    {campaigns.map(campaign => {
                      const campaignSubmissions = submissions.filter(s => s.campaignId === campaign.id);
                      return (
                        <button
                          key={campaign.id}
                          onClick={() => setSelectedCampaignId(campaign.id)}
                          className={`w-full text-left p-3 rounded-lg transition ${
                            selectedCampaignId === campaign.id
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-primary hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <p className="font-medium text-sm truncate">{campaign.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {campaignSubmissions.length} pending
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Submissions List & Review */}
              <div className="lg:col-span-3 space-y-6">
                {/* Submissions List */}
                <Card className="p-4">
                  <h3 className="font-semibold text-primary mb-3">
                    Submissions
                    {selectedCampaign && ` for "${selectedCampaign.title}"`}
                  </h3>

                  {submissions.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No pending submissions</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {submissions.map(submission => (
                        <button
                          key={submission.id}
                          onClick={() => setSelectedSubmissionId(submission.id)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition ${
                            selectedSubmissionId === submission.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-default bg-surface hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-primary">
                                {submission.testerId}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            {submission.results?.overallRating && (
                              <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                ⭐ {submission.results.overallRating}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Submission Review */}
                {selectedSubmission ? (
                  <SubmissionReview
                    submission={selectedSubmission}
                    campaign={selectedCampaign}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isLoading={loading}
                  />
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a submission to review
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
