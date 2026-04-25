/**
 * Admin Review Panel
 * For admins to review and approve/reject campaign submissions
 * 
 * Core Principles:
 * - MODULAR: Standalone admin component
 * - CLEAN: Clear review workflow
 */

import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import {
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const QUALITY_SCORES = [1, 2, 3, 4, 5];

export default function AdminReviewPanel({ submission, campaign, onReview, loading = false }) {
  const [reviewData, setReviewData] = useState({
    status: 'under_review',
    qualityScore: 3,
    feedback: ''
  });

  const [error, setError] = useState(null);

  const handleReview = async (status) => {
    if (!feedback && status !== 'rejected') {
      setError('Please provide feedback');
      return;
    }

    try {
      setError(null);
      await onReview({
        ...reviewData,
        status
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!submission) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">No submission selected</p>
      </Card>
    );
  }

  const { feedback } = reviewData;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review Submission
        </h2>
        <p className="text-gray-600">
          Campaign: {campaign?.title}
        </p>
      </div>

      {/* Submission Details */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tester&apos;s Message</h3>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {submission.message}
            </p>
          </div>
        </div>

        {/* Attachments */}
        {submission.attachments && submission.attachments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Evidence ({submission.attachments.length})
            </h3>
            <div className="space-y-2">
              {submission.attachments.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span className="truncate">{url}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="space-y-4 border-t pt-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Quality Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality Score
          </label>
          <div className="flex gap-2">
            {QUALITY_SCORES.map((score) => (
              <button
                key={score}
                onClick={() => setReviewData(prev => ({ ...prev, qualityScore: score }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reviewData.qualityScore === score
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {score}⭐
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide feedback to the tester (optional for rejection)..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => handleReview('accepted')}
            disabled={loading}
            variant="primary"
            leftIcon={<CheckCircleIcon className="w-4 h-4" />}
            className="flex-1"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Approve'}
          </Button>
          <Button
            onClick={() => handleReview('rejected')}
            disabled={loading}
            variant="outline"
            leftIcon={<XCircleIcon className="w-4 h-4" />}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Reject'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
