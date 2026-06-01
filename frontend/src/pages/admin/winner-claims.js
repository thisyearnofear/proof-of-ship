/**
 * Admin Winner Claims Page
 *
 * Review and approve/reject hackathon winner claims from unverified builders.
 *
 * Shows contact info (email, telegram, wantsCall), supports marking as contacted,
 * and stores reviewer notes + attribution.
 */

import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/stores/authStore';
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
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  DocumentTextIcon,
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
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    if (currentUser === null) return;
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
    if (currentUser) loadClaims();
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
          notes: reviewNotes[claim.id] || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to approve claim');
      }

      setActionSuccess(`Verified ${claim.hackathonName} winner: ${claim.githubRepo}`);
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
          notes: reviewNotes[claim.id] || null,
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

  const handleMarkContacted = async (claimId) => {
    setProcessingId(claimId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/winner-claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          action: 'contacted',
          notes: reviewNotes[claimId] || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to mark as contacted');
      }

      setActionSuccess('Marked as contacted');
      setClaims((prev) => prev.map((c) =>
        c.id === claimId ? { ...c, contactedAt: new Date().toISOString() } : c
      ));
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

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : claims.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">All caught up</h3>
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
                onMarkContacted={() => handleMarkContacted(claim.id)}
                processing={processingId === claim.id}
                rejectionReason={rejectionReasons[claim.id] || ''}
                onRejectionReasonChange={(val) =>
                  setRejectionReasons((prev) => ({ ...prev, [claim.id]: val }))
                }
                reviewNotes={reviewNotes[claim.id] || ''}
                onReviewNotesChange={(val) =>
                  setReviewNotes((prev) => ({ ...prev, [claim.id]: val }))
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ClaimCard({ claim, onApprove, onReject, onMarkContacted, processing, rejectionReason, onRejectionReasonChange, reviewNotes, onReviewNotesChange }) {
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Card className="p-6 border border-default hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <ClockIcon className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-primary">{claim.hackathonName}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium capitalize">
              {claim.outcome}
            </span>
            {claim.wantsCall && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                <PhoneIcon className="w-3 h-3" />
                Wants call
              </span>
            )}
            {claim.contactedAt && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                <CheckCircleIcon className="w-3 h-3" />
                Contacted
              </span>
            )}
          </div>

          {/* Contact info */}
          {(claim.email || claim.telegram) && (
            <div className="flex flex-wrap items-center gap-3 mb-2 text-xs text-secondary">
              {claim.email && (
                <span className="inline-flex items-center gap-1">
                  <EnvelopeIcon className="w-3.5 h-3.5" />
                  {claim.email}
                </span>
              )}
              {claim.telegram && (
                <span className="inline-flex items-center gap-1">
                  <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                  {claim.telegram}
                </span>
              )}
            </div>
          )}

          {/* Claim details */}
          <div className="space-y-1 text-sm text-secondary mb-3">
            <p>
              <span className="text-tertiary">User:</span>{' '}
              {claim.uid?.slice(0, 8)}...{claim.uid?.slice(-4)}
              {claim.githubUsername && <span className="text-gray-400"> · @{claim.githubUsername}</span>}
            </p>
            <p>
              <a href={claim.githubRepo} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                {claim.githubRepo}
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </p>
            <p>
              <a href={claim.announcementUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
                View announcement
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </p>
            <p className="text-xs text-tertiary">
              Submitted {new Date(claim.submittedAt).toLocaleDateString()} at{' '}
              {new Date(claim.submittedAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <Textarea
              placeholder="Review notes (visible to other reviewers)"
              value={reviewNotes}
              onChange={(e) => onReviewNotesChange(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={onApprove} disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {processing ? <LoadingSpinner size="sm" /> : <CheckCircleIcon className="w-4 h-4 mr-1.5" />}
              Approve
            </Button>
            {!claim.contactedAt && (
              <Button onClick={onMarkContacted} disabled={processing} variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50">
                <PhoneIcon className="w-4 h-4 mr-1.5" />
                Mark contacted
              </Button>
            )}
            <Button onClick={() => setShowRejectForm(!showRejectForm)} variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50">
              <XCircleIcon className="w-4 h-4 mr-1.5" />
              Reject
            </Button>
          </div>

          {showRejectForm && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Why is this claim being rejected?"
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button onClick={onReject} disabled={processing || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white">
                  {processing ? <LoadingSpinner size="sm" /> : null}
                  Confirm Reject
                </Button>
                <Button onClick={() => { setShowRejectForm(false); onRejectionReasonChange(''); }} variant="ghost">
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
