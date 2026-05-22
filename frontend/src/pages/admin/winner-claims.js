/**
 * Admin Winner Claims Page
 *
 * Review and approve/reject hackathon winner claims from unverified builders.
 *
 * Follows the same pattern as admin/submissions.js:
 * - Load pending claims via server API
 * - Approve writes to hackathonWinners/{uid}
 * - Reject sets claim status and optional reason
 */

import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import {
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function AdminWinnerClaimsPage() {
  const router = useRouter();
  const { currentUser } = useUser();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});

  // Auth gate — redirect to login if not authenticated
  useEffect(() => {
    if (currentUser === null) {
      // Still loading
      return;
    }
    if (!currentUser) {
      router.push('/login?redirect=/admin/winner-claims');
    }
  }, [currentUser, router]);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/winner-claims');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load claims');
      }
      const data = await res.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error('Failed to load winner claims:', err);
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadClaims();
    }
  }, [currentUser, loadClaims]);

  const handleApprove = async (claim) => {
    setProcessingId(claim.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/winner-claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claim.id,
          action: 'approve',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to approve claim');
      }

      setActionSuccess(`Verified ${claim.hackathonName} winner: ${claim.githubRepo}`);
      // Remove from local list
      setClaims((prev) => prev.filter((c) => c.id !== claim.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claim) => {
    const reason = rejectionReasons[claim.id] || '';
    if (!reason.trim()) {
      setActionError('Please provide a rejection reason');
      return;
    }

    setProcessingId(claim.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/winner-claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claim.id,
          action: 'reject',
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to reject claim');
      }

      setActionSuccess(`Rejected claim for ${claim.hackathonName}`);
      setClaims((prev) => prev.filter((c) => c.id !== claim.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Winner Claims — Admin | Proof of Ship</title>
      </Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <TrophyIcon className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">Winner Claims</h1>
            <p className="text-sm text-secondary">
              Review and verify hackathon winner claims from builders
            </p>
          </div>
        </div>

        {/* Action feedback */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <XCircleIcon className="w-5 h-5 flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : claims.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              All caught up
            </h3>
            <p className="text-secondary max-w-md mx-auto">
              No pending winner claims. New claims from builders will appear here for review.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onApprove={() => handleApprove(claim)}
                onReject={() => handleReject(claim)}
                processing={processingId === claim.id}
                rejectionReason={rejectionReasons[claim.id] || ''}
                onRejectionReasonChange={(val) =>
                  setRejectionReasons((prev) => ({ ...prev, [claim.id]: val }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ClaimCard({ claim, onApprove, onReject, processing, rejectionReason, onRejectionReasonChange }) {
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Card className="p-6 border border-default hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Status icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <ClockIcon className="w-5 h-5 text-amber-600" />
        </div>

        {/* Claim info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary">
              {claim.hackathonName}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium capitalize">
              {claim.outcome}
            </span>
          </div>

          <div className="space-y-1 text-sm text-secondary mb-3">
            <p>
              <span className="text-tertiary">User:</span>{' '}
              {claim.uid?.slice(0, 8)}...
              {claim.uid?.slice(-4)}
            </p>
            <p>
              <a
                href={claim.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                {claim.githubRepo}
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </p>
            <p>
              <a
                href={claim.announcementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                View announcement
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </p>
            <p className="text-xs text-tertiary">
              Submitted {new Date(claim.submittedAt).toLocaleDateString()} at{' '}
              {new Date(claim.submittedAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onApprove}
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {processing ? <LoadingSpinner size="sm" /> : <CheckCircleIcon className="w-4 h-4 mr-1.5" />}
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectForm(!showRejectForm)}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircleIcon className="w-4 h-4 mr-1.5" />
              Reject
            </Button>
          </div>

          {/* Rejection reason */}
          {showRejectForm && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Why is this claim being rejected?"
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={onReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {processing ? <LoadingSpinner size="sm" /> : null}
                  Confirm Reject
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectForm(false);
                    onRejectionReasonChange('');
                  }}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
