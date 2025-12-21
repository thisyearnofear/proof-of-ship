/**
 * Token Allocation Form
 * For developers to offer equity to testers after campaign completion
 * Includes vesting schedule configuration
 */

import { useState, useEffect } from 'react';
import useTokenAllocations from '@/hooks/useTokenAllocations';
import { sanitizeTokenAllocation } from '@/schemas/tokenAllocation';

const RELEASE_SCHEDULES = {
  linear: 'Linear (even release over time)',
  milestone: 'Milestone-based (custom releases)',
};

export default function TokenAllocationForm({ campaignId, testerId, submission, onSave = null, onClose = null }) {
  const { createAllocation, loading: allocating } = useTokenAllocations();
  const [formData, setFormData] = useState({
    campaignId,
    testerId,
    submissionId: submission?.id || '',
    percentage: 5,
    vestingSchedule: {
      cliffMonths: 0,
      vestingMonths: 12,
      releaseSchedule: 'linear',
      milestones: [],
    },
    approvalNotes: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = field.split('.');
      let obj = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }

      obj[keys[keys.length - 1]] = value;
      return updated;
    });

    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleAddMilestone = () => {
    setFormData(prev => ({
      ...prev,
      vestingSchedule: {
        ...prev.vestingSchedule,
        milestones: [
          ...(prev.vestingSchedule.milestones || []),
          { month: 0, percentage: 0, description: '' }
        ]
      }
    }));
  };

  const handleUpdateMilestone = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      vestingSchedule: {
        ...prev.vestingSchedule,
        milestones: prev.vestingSchedule.milestones.map((m, i) =>
          i === index ? { ...m, [field]: value } : m
        )
      }
    }));
  };

  const handleRemoveMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      vestingSchedule: {
        ...prev.vestingSchedule,
        milestones: prev.vestingSchedule.milestones.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sanitized = sanitizeTokenAllocation(formData);

      const allocationId = await createAllocation(sanitized);

      setSuccessMessage('Token allocation offered to tester');
      setTimeout(() => {
        if (onSave) onSave(allocationId);
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Offer Token Allocation
      </h2>

      {errors.form && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {errors.form}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Tester Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Tester:</strong> {testerId}
          </p>
          {submission && (
            <p className="text-sm text-blue-900 dark:text-blue-300 mt-1">
              <strong>Rating:</strong> {submission.results?.overallRating}/5 stars
            </p>
          )}
        </div>

        {/* Token Percentage */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
            Token Allocation (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.percentage}
            onChange={(e) => handleChange('percentage', parseFloat(e.target.value) || 0)}
            placeholder="e.g., 5.5"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Percentage of project tokens allocated to this tester
          </p>
        </div>

        {/* Vesting Schedule */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vesting Schedule</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Cliff Period (months)
              </label>
              <input
                type="number"
                min="0"
                value={formData.vestingSchedule.cliffMonths}
                onChange={(e) => handleChange('vestingSchedule.cliffMonths', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Months before vesting begins</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Total Vesting Period (months)
              </label>
              <input
                type="number"
                min="1"
                value={formData.vestingSchedule.vestingMonths}
                onChange={(e) => handleChange('vestingSchedule.vestingMonths', parseInt(e.target.value) || 12)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Duration of vesting period</p>
            </div>
          </div>

          {/* Release Schedule Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Release Schedule
            </label>
            <select
              value={formData.vestingSchedule.releaseSchedule}
              onChange={(e) => handleChange('vestingSchedule.releaseSchedule', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(RELEASE_SCHEDULES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Milestones (if milestone-based) */}
          {formData.vestingSchedule.releaseSchedule === 'milestone' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Release Milestones</h4>

              {formData.vestingSchedule.milestones?.map((milestone, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Month</label>
                      <input
                        type="number"
                        min="0"
                        value={milestone.month}
                        onChange={(e) => handleUpdateMilestone(idx, 'month', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Release %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={milestone.percentage}
                        onChange={(e) => handleUpdateMilestone(idx, 'percentage', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={milestone.description}
                    onChange={(e) => handleUpdateMilestone(idx, 'description', e.target.value)}
                    placeholder="e.g., Launch on mainnet"
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => handleRemoveMilestone(idx)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddMilestone}
                className="px-3 py-1 border border-blue-600 text-blue-600 dark:text-blue-400 rounded text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                + Add Milestone
              </button>
            </div>
          )}
        </div>

        {/* Approval Notes */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
            Notes (optional)
          </label>
          <textarea
            value={formData.approvalNotes}
            onChange={(e) => handleChange('approvalNotes', e.target.value.substring(0, 1000))}
            placeholder="Additional context about this allocation..."
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.approvalNotes.length}/1000
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Offering...' : 'Offer Allocation'}
        </button>
      </div>
    </div>
  );
}
