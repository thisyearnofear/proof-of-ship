/**
 * Equity Dashboard
 * For testers to view token allocations, vesting schedules, and accept/reject offers
 */

import { useState, useEffect } from 'react';
import useTokenAllocations from '@/hooks/useTokenAllocations';
import { calculateVestingProgress } from '@/schemas/tokenAllocation';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function EquityDashboard({ testerId }) {
  const { getAllocationsByTester, acceptAllocation, rejectAllocation, loading } = useTokenAllocations();
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (testerId) {
      loadAllocations();
    }
  }, [testerId]);

  const loadAllocations = async () => {
    const data = await getAllocationsByTester(testerId);
    setAllocations(data || []);
  };

  const handleAccept = async (allocationId) => {
    setActionLoading(true);
    try {
      await acceptAllocation(allocationId);
      await loadAllocations();
    } catch (error) {
      console.error('Error accepting allocation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (allocationId) => {
    setActionLoading(true);
    try {
      await rejectAllocation(allocationId);
      await loadAllocations();
    } catch (error) {
      console.error('Error rejecting allocation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    offered: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    accepted: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    vesting: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    vested: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  };

  const statusIcons = {
    offered: <ClockIcon className="w-4 h-4" />,
    accepted: <CheckCircleIcon className="w-4 h-4" />,
    rejected: <XCircleIcon className="w-4 h-4" />,
    vesting: <SparklesIcon className="w-4 h-4" />,
    vested: <CheckCircleIcon className="w-4 h-4" />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!allocations || allocations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Token Allocations Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete testing campaigns to earn token equity offers
        </p>
      </div>
    );
  }

  // Calculate summary stats
  const offered = allocations.filter(a => a.status === 'offered');
  const accepted = allocations.filter(a => ['accepted', 'vesting', 'vested'].includes(a.status));
  const totalPercentage = accepted.reduce((sum, a) => sum + (a.percentage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Offers</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{offered.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Accepted Allocations</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{accepted.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Equity</p>
          <p className="text-3xl font-bold text-green-600">{totalPercentage.toFixed(2)}%</p>
        </div>
      </div>

      {/* Allocations List */}
      <div className="space-y-4">
        {allocations.map((allocation) => {
          const vestingProgress = allocation.status === 'vesting' || allocation.status === 'vested'
            ? calculateVestingProgress(allocation)
            : null;

          return (
            <div
              key={allocation.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedAllocation(allocation)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {allocation.percentage.toFixed(2)}% Token Allocation
                    </h3>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[allocation.status]}`}>
                      {statusIcons[allocation.status]}
                      {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Campaign: {allocation.campaignId}
                  </p>
                </div>
                {allocation.status === 'offered' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(allocation.id);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(allocation.id);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1 border border-red-600 text-red-600 rounded text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>

              {/* Vesting Info */}
              {allocation.vestingSchedule && (
                <div className="grid grid-cols-2 gap-4 text-sm mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Cliff Period</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {allocation.vestingSchedule.cliffMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Vesting Period</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {allocation.vestingSchedule.vestingMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Schedule Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {allocation.vestingSchedule.releaseSchedule}
                    </p>
                  </div>
                  {vestingProgress && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Vested</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {vestingProgress.percentage.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Vesting Progress Bar */}
              {vestingProgress && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vesting Progress</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {vestingProgress.status === 'fully_vested' ? 'Fully Vested' : 'In Progress'}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vestingProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                {allocation.acceptedAt && (
                  <p>Accepted: {new Date(allocation.acceptedAt).toLocaleDateString()}</p>
                )}
                {allocation.vestingStartedAt && (
                  <p>Vesting Started: {new Date(allocation.vestingStartedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedAllocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Allocation Details
              </h2>
              <button
                onClick={() => setSelectedAllocation(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedAllocation.approvalNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedAllocation.approvalNotes}
                  </p>
                </div>
              )}

              {selectedAllocation.vestingSchedule?.milestones && selectedAllocation.vestingSchedule.milestones.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Release Milestones</p>
                  <div className="space-y-2">
                    {selectedAllocation.vestingSchedule.milestones.map((m, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-700 dark:text-gray-300">
                          Month {m.month}: {m.percentage}%
                        </span>
                        {m.description && (
                          <span className="text-gray-600 dark:text-gray-400">({m.description})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
