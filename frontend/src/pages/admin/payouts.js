/**
 * Admin Payout Management Page
 * Review, approve, and track USDC payouts and token allocations
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import usePayouts from '@/hooks/usePayouts';
import useTokenAllocations from '@/hooks/useTokenAllocations';
import useCampaigns from '@/hooks/useCampaigns';
import TokenAllocationForm from '@/components/campaigns/TokenAllocationForm';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function AdminPayoutsPage() {
  const { getPayoutsByCampaign, createPayout, completePayout, loading: payoutsLoading } = usePayouts();
  const { getAllocationsByCampaign, loading: allocationsLoading } = useTokenAllocations();
  const { getCampaigns, loading: campaignsLoading } = useCampaigns();

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [tab, setTab] = useState('payouts'); // payouts | allocations
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadPayoutsAndAllocations();
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    const data = await getCampaigns({ status: 'closed' });
    setCampaigns(data);
    if (data.length > 0) {
      setSelectedCampaign(data[0]);
    }
  };

  const loadPayoutsAndAllocations = async () => {
    if (selectedCampaign) {
      const [payoutsData, allocationsData] = await Promise.all([
        getPayoutsByCampaign(selectedCampaign.id),
        getAllocationsByCampaign(selectedCampaign.id),
      ]);
      setPayouts(payoutsData);
      setAllocations(allocationsData);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  };

  const statusIcons = {
    pending: <ClockIcon className="w-4 h-4" />,
    processing: <ClockIcon className="w-4 h-4" />,
    completed: <CheckCircleIcon className="w-4 h-4" />,
    failed: <XCircleIcon className="w-4 h-4" />,
  };

  if (campaignsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin - Payout Management</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary mb-8">Payout Management</h1>

          {/* Campaign Selector */}
          <div className="bg-surface rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-semibold mb-3 text-primary">
              Select Campaign
            </label>
            <select
              value={selectedCampaign?.id || ''}
              onChange={(e) => {
                const campaign = campaigns.find(c => c.id === e.target.value);
                setSelectedCampaign(campaign);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a campaign</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title} - {campaign.stats?.totalSubmissions || 0} submissions
                </option>
              ))}
            </select>
          </div>

          {selectedCampaign && (
            <>
              {/* Tabs */}
              <div className="bg-surface rounded-lg shadow mb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setTab('payouts')}
                    className={`flex-1 px-6 py-4 font-medium text-center ${
                      tab === 'payouts'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-secondary hover:text-primary dark:hover:text-gray-200'
                    }`}
                  >
                    USDC Payouts ({payouts.length})
                  </button>
                  <button
                    onClick={() => setTab('allocations')}
                    className={`flex-1 px-6 py-4 font-medium text-center ${
                      tab === 'allocations'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-secondary hover:text-primary dark:hover:text-gray-200'
                    }`}
                  >
                    Token Allocations ({allocations.length})
                  </button>
                </div>
              </div>

              {/* Payouts Tab */}
              {tab === 'payouts' && (
                <div className="space-y-4">
                  {payoutsLoading ? (
                    <LoadingSpinner />
                  ) : payouts.length === 0 ? (
                    <div className="bg-surface rounded-lg shadow p-8 text-center">
                      <p className="text-secondary">No payouts for this campaign</p>
                    </div>
                  ) : (
                    payouts.map(payout => (
                      <div
                        key={payout.id}
                        className="bg-surface rounded-lg shadow p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-primary">
                              ${payout.usdc.toFixed(2)} USDC
                            </h3>
                            <p className="text-sm text-secondary mt-1">
                              To: {payout.testerId}
                            </p>
                          </div>
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[payout.status]}`}>
                            {statusIcons[payout.status]}
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </div>

                        {payout.errorMessage && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
                            {payout.errorMessage}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-secondary">Circle Transfer ID</p>
                            <p className="font-mono text-xs text-primary dark:text-gray-300">
                              {payout.circleTransferId || 'Pending'}
                            </p>
                          </div>
                          {payout.transactionHash && (
                            <div>
                              <p className="text-secondary">Transaction Hash</p>
                              <p className="font-mono text-xs text-primary dark:text-gray-300">
                                {payout.transactionHash}
                              </p>
                            </div>
                          )}
                        </div>

                        {payout.status === 'processing' && (
                          <button
                            onClick={() => completePayout(payout.id, '')}
                            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Allocations Tab */}
              {tab === 'allocations' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAllocationForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + New Token Allocation
                  </button>

                  {showAllocationForm && (
                    <TokenAllocationForm
                      campaignId={selectedCampaign.id}
                      testerId=""
                      submission={selectedSubmission}
                      onSave={() => {
                        loadPayoutsAndAllocations();
                        setShowAllocationForm(false);
                      }}
                      onClose={() => setShowAllocationForm(false)}
                    />
                  )}

                  {allocationsLoading ? (
                    <LoadingSpinner />
                  ) : allocations.length === 0 ? (
                    <div className="bg-surface rounded-lg shadow p-8 text-center">
                      <p className="text-secondary">No allocations for this campaign</p>
                    </div>
                  ) : (
                    allocations.map(allocation => (
                      <div
                        key={allocation.id}
                        className="bg-surface rounded-lg shadow p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-primary">
                              {allocation.percentage.toFixed(2)}% to {allocation.testerId}
                            </h3>
                            <p className="text-sm text-secondary mt-1">
                              {allocation.vestingSchedule?.cliffMonths} month cliff, {allocation.vestingSchedule?.vestingMonths} month vesting
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[allocation.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                          </span>
                        </div>

                        {allocation.approvalNotes && (
                          <p className="text-sm text-secondary mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                            {allocation.approvalNotes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
