/**
 * Proof leaderboard scoring helpers
 *
 * Shared scoring logic for hackathon claims, builders, projects, and hackathons.
 */

export function getClaimEvidenceCount(claim = {}) {
  return [
    claim.announcementUrl,
    claim.submissionUrl || claim.url,
    claim.evidenceUrl,
    claim.payoutTxHash,
    claim.payoutWallet,
    claim.contractAddress,
    claim.repoUrl,
  ].filter((value) => Boolean(String(value || '').trim())).length;
}

export function getClaimProofStrength(claim = {}) {
  const hasAnnouncement = Boolean(String(claim.announcementUrl || '').trim());
  const hasSubmission = Boolean(String(claim.submissionUrl || claim.url || '').trim());
  const hasEvidenceUrl = Boolean(String(claim.evidenceUrl || '').trim());
  const hasPayoutTx = Boolean(String(claim.payoutTxHash || '').trim());
  const hasPayoutWallet = Boolean(String(claim.payoutWallet || '').trim());
  const hasRepo = Boolean(String(claim.repoUrl || '').trim());
  const hasContract = Boolean(String(claim.contractAddress || '').trim());
  const payoutVerified = Boolean(claim.payoutVerified || claim.payoutVerifiedAt || claim.verificationStatus === 'payout_verified');
  const walletLinked = claim.verificationStatus === 'wallet_linked';

  if (payoutVerified && hasPayoutTx && hasPayoutWallet && (hasRepo || hasContract || hasSubmission)) {
    return 'high';
  }

  if ((hasAnnouncement || hasSubmission || hasEvidenceUrl) && (hasRepo || hasContract || hasPayoutWallet || hasPayoutTx || walletLinked)) {
    return 'medium';
  }

  if (hasAnnouncement || hasSubmission || hasEvidenceUrl || hasPayoutTx || hasPayoutWallet || hasRepo || hasContract) {
    return 'low';
  }

  return 'none';
}

export function getClaimProofScore(claim = {}) {
  const evidenceCount = getClaimEvidenceCount(claim);
  const strength = getClaimProofStrength(claim);
  const outcome = String(claim.outcome || '').trim().toLowerCase();

  let score = 0;

  if (strength === 'high') score += 55;
  else if (strength === 'medium') score += 35;
  else if (strength === 'low') score += 15;

  score += Math.min(25, evidenceCount * 4);

  if (outcome === 'winner' || outcome === 'bounty winner') score += 15;
  else if (outcome === 'finalist') score += 10;
  else if (outcome === 'submitted') score += 5;

  if (claim.verificationStatus === 'payout_verified') score += 10;
  else if (claim.verificationStatus === 'wallet_linked') score += 6;
  else if (claim.verificationStatus === 'evidence_attached') score += 4;

  return Math.min(100, Math.round(score));
}

export function summarizeClaimProof(claim = {}) {
  const proofScore = getClaimProofScore(claim);
  const proofStrength = getClaimProofStrength(claim);
  const evidenceCount = getClaimEvidenceCount(claim);
  const hasStrongProof = proofStrength === 'high' || proofScore >= 70;
  const isVerifiedWin = ['winner', 'bounty winner'].includes(String(claim.outcome || '').trim().toLowerCase())
    && Boolean(claim.payoutVerified || claim.payoutVerifiedAt || claim.verificationStatus === 'payout_verified');

  return {
    proofScore,
    proofStrength,
    evidenceCount,
    hasStrongProof,
    isVerifiedWin,
  };
}
