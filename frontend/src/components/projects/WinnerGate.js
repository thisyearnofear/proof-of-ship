/**
 * WinnerGate — interstitial shown to unverified users in the project editor
 *
 * Enhances ProjectEditor without replacing it. Blocks submission until the
 * user is verified as a past hackathon winner.
 *
 * Three states:
 *   1. Loading checking status
 *   2. Claim form (not verified, no pending claim)
 *   3. Pending review (not verified, has pending claim)
 */

import { useState } from 'react';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Input, Textarea, Select } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import {
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  SparklesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function WinnerGate({ onSubmitClaim, loading, pendingClaim, error }) {
  const [hackathonName, setHackathonName] = useState('');
  const [announcementUrl, setAnnouncementUrl] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [outcome, setOutcome] = useState('winner');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // If there's already a pending claim on the server, show that state
  if (pendingClaim) {
    return <PendingReviewState />;
  }

  // If already submitted locally, show pending review
  if (submitted) {
    return <PendingReviewState />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    if (!hackathonName.trim()) {
      setSubmitError('Hackathon name is required');
      setSubmitting(false);
      return;
    }

    if (!announcementUrl.trim()) {
      setSubmitError('A public announcement URL is required (e.g. Twitter/X)');
      setSubmitting(false);
      return;
    }

    if (!githubRepo.trim()) {
      setSubmitError('GitHub repo URL is required');
      setSubmitting(false);
      return;
    }

    const result = await onSubmitClaim({
      hackathonName: hackathonName.trim(),
      announcementUrl: announcementUrl.trim(),
      githubRepo: githubRepo.trim(),
      outcome,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setSubmitError(result.error || 'Failed to submit claim');
    }
  };

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg mb-4">
          <TrophyIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">
          This Platform Is for Past Hackathon Winners
        </h2>
        <p className="text-secondary max-w-lg mx-auto">
          Proof of Ship is exclusive to builders who have won a hackathon and are continuing
          that project. Show us your win and we&apos;ll verify you within 24 hours.
        </p>
      </div>

      {/* Why */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
            Proven Signal
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            A hackathon win is stronger proof-of-concept than a pitch deck
          </p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
            Payout Transparency
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Leaderboard ranks hackathons by payout speed, so you know who pays
          </p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-center">
          <div className="text-2xl mb-1">🚀</div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            No Fresh Starts
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Continue the project you already proved worth building
          </p>
        </div>
      </div>

      {/* Claim form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Hackathon Name
          </label>
          <Input
            placeholder="e.g. ETHGlobal HackFS 2024"
            value={hackathonName}
            onChange={(e) => setHackathonName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Winner Announcement URL
          </label>
          <Input
            placeholder="e.g. https://x.com/username/status/..."
            value={announcementUrl}
            onChange={(e) => setAnnouncementUrl(e.target.value)}
            required
          />
          <p className="text-xs text-tertiary mt-1">
            Public announcement (Twitter/X, Devpost, blog) showing your project won
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Winning Project GitHub URL
          </label>
          <Input
            placeholder="e.g. https://github.com/username/project"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1">
            Outcome
          </label>
          <Select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          >
            <option value="winner">Winner</option>
            <option value="finalist">Finalist / Runner-up</option>
          </Select>
        </div>

        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {submitError}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full justify-center"
        >
          {submitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Submitting claim...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Submit for Verification
            </>
          )}
        </Button>

        <p className="text-xs text-tertiary text-center">
          The founder reviews every claim personally. You&apos;ll typically get verified within 24 hours.
        </p>
      </form>
    </Card>
  );
}

function PendingReviewState() {
  return (
    <Card className="p-8 max-w-lg mx-auto text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg mb-4">
        <ClockIcon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-primary mb-2">
        Claim Pending Review
      </h2>
      <p className="text-secondary mb-6">
        Your hackathon winner claim has been submitted. The founder will review it and
        verify you within 24 hours. Check back soon!
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
        <CheckCircleIcon className="w-5 h-5 text-blue-600" />
        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          We&apos;ll notify you when verified
        </span>
      </div>
    </Card>
  );
}
