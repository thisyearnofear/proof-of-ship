/**
 * Admin Submission Review Component
 * Simple, focused: Review, approve, or reject submissions
 * 
 * Core Principles:
 * - CLEAN: Single responsibility - approve/reject only
 * - MODULAR: Reusable for different contexts
 * - ORGANIZED: Clear data flow
 */

import { useState } from 'react';
import Button from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useNanopayment } from '@/contexts/WalletContext';

export default function SubmissionReview({
  submission,
  onApprove = null,
  onReject = null,
  isLoading = false,
  campaign = null,
}) {
  const [notes, setNotes] = useState(submission?.approvalNotes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { isInitialized, payForVerification, initializeWithDemo } = useNanopayment();

  const handleApprove = async () => {
    if (onApprove) {
      await onApprove(submission.id, notes);
    }
  };

  const handleReject = async () => {
    if (onReject) {
      await onReject(submission.id, notes);
    }
  };

  const handleAIVerify = async () => {
    if (!isInitialized) {
      await initializeWithDemo();
    }
    
    setIsVerifying(true);
    try {
      // Mocking 100 lines of code for the verification
      const result = await payForVerification(submission.id, 100);
      
      if (result.success && result.data?.verification) {
        const { approved, summary } = result.data.verification;
        const aiNotes = `🤖 AI Verifier Agent: ${summary}`;
        
        setNotes(aiNotes);
        
        if (approved) {
          if (onApprove) await onApprove(submission.id, aiNotes);
        } else {
          if (onReject) await onReject(submission.id, aiNotes);
        }
      }
    } catch (error) {
      console.error("AI Verification failed:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!submission) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No submission selected</p>
      </Card>
    );
  }

  const rating = submission.results?.overallRating || 0;
  const passedScenarios = submission.results?.scenarioResults?.filter(s => s.passed).length || 0;
  const totalScenarios = submission.results?.scenarioResults?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Submission from {submission.testerId}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Submitted {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          submission.status === 'approved'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : submission.status === 'rejected'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
        }`}>
          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Overall Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon
                key={star}
                className={`w-4 h-4 ${
                  star <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{rating}/5</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Test Scenarios</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {passedScenarios}/{totalScenarios}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">passed</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Evidence Files</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {submission.results?.evidence?.length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">uploaded</p>
        </Card>
      </div>

      {/* Test Results */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Test Results</h4>
        <div className="space-y-2">
          {submission.results?.scenarioResults?.map((result, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              {result.passed ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Scenario {idx + 1}: {result.passed ? 'Passed' : 'Failed'}
                </p>
                {result.notes && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feedback */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tester Feedback</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {submission.results?.feedback}
        </p>
      </Card>

      {/* Bugs Found */}
      {submission.results?.bugsSeverity && submission.results.bugsSeverity.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Bugs Reported</h4>
          <div className="space-y-2">
            {submission.results.bugsSeverity.map((bug, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${
                  bug.severity === 'critical'
                    ? 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                    : bug.severity === 'high'
                    ? 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
                    : bug.severity === 'medium'
                    ? 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                    : 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                }`}>
                  {bug.severity.toUpperCase()}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{bug.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Evidence */}
      {submission.results?.evidence && submission.results.evidence.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Evidence</h4>
          <div className="space-y-2">
            {submission.results.evidence.map((evidence, idx) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {evidence.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(evidence.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {evidence.type}
                  </span>
                </div>
                {evidence.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{evidence.description}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Admin Notes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Admin Notes</h4>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showNotes ? 'Hide' : 'Edit'}
          </button>
        </div>

        {showNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add approval or rejection notes..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {submission.approvalNotes || 'No notes added'}
          </p>
        )}
      </Card>

      {/* Action Buttons */}
      {submission.status === 'submitted' && (
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAIVerify}
            disabled={isLoading || isVerifying}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-indigo-600"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">Streaming 0.01 USDC...</span>
            ) : (
              <span className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                AI Auto-Verify (0.01 USDC)
              </span>
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              disabled={isLoading || isVerifying}
              variant="outline"
              className="flex-1 text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isLoading && !isVerifying ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading || isVerifying}
              className="flex-1"
            >
              {isLoading && !isVerifying ? 'Processing...' : 'Approve & Reward'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
