/**
 * Token Allocation & Equity Tracking Schemas
 * Validates token allocations, vesting schedules, and payouts
 */

// Token allocation validation
export const validateTokenAllocation = (allocation) => {
  const errors = [];

  if (!allocation.campaignId || typeof allocation.campaignId !== 'string') {
    errors.push('Campaign ID is required');
  }

  if (!allocation.testerId || typeof allocation.testerId !== 'string') {
    errors.push('Tester ID is required');
  }

  if (typeof allocation.percentage !== 'number' || allocation.percentage <= 0 || allocation.percentage > 100) {
    errors.push('Token percentage must be between 0 and 100');
  }

  if (!allocation.vestingSchedule || typeof allocation.vestingSchedule !== 'object') {
    errors.push('Vesting schedule is required');
  } else {
    const { cliffMonths, vestingMonths, releaseSchedule } = allocation.vestingSchedule;
    
    if (typeof cliffMonths !== 'number' || cliffMonths < 0) {
      errors.push('Cliff months must be a non-negative number');
    }

    if (typeof vestingMonths !== 'number' || vestingMonths <= 0) {
      errors.push('Vesting months must be greater than 0');
    }

    if (releaseSchedule && !['linear', 'milestone'].includes(releaseSchedule)) {
      errors.push('Release schedule must be "linear" or "milestone"');
    }
  }

  if (allocation.status && !['draft', 'offered', 'accepted', 'vesting', 'vested', 'rejected'].includes(allocation.status)) {
    errors.push('Invalid allocation status');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Payout validation
export const validatePayout = (payout) => {
  const errors = [];

  if (!payout.campaignId || typeof payout.campaignId !== 'string') {
    errors.push('Campaign ID is required');
  }

  if (!payout.testerId || typeof payout.testerId !== 'string') {
    errors.push('Tester ID is required');
  }

  if (!payout.submissionId || typeof payout.submissionId !== 'string') {
    errors.push('Submission ID is required');
  }

  if (typeof payout.usdc !== 'number' || payout.usdc < 0) {
    errors.push('USDC amount must be non-negative');
  }

  if (payout.tokenPercentage && (typeof payout.tokenPercentage !== 'number' || payout.tokenPercentage < 0 || payout.tokenPercentage > 100)) {
    errors.push('Token percentage must be between 0 and 100');
  }

  if (!['pending', 'processing', 'completed', 'failed'].includes(payout.status)) {
    errors.push('Invalid payout status');
  }

  if (payout.circleTransferId && typeof payout.circleTransferId !== 'string') {
    errors.push('Circle transfer ID must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize token allocation
export const sanitizeTokenAllocation = (allocation) => {
  const sanitized = {
    campaignId: String(allocation.campaignId || '').trim(),
    testerId: String(allocation.testerId || '').trim(),
    submissionId: String(allocation.submissionId || '').trim(),
    percentage: Math.min(100, Math.max(0, typeof allocation.percentage === 'number' ? allocation.percentage : 0)),
    vestingSchedule: allocation.vestingSchedule && typeof allocation.vestingSchedule === 'object'
      ? {
          cliffMonths: typeof allocation.vestingSchedule.cliffMonths === 'number' ? Math.max(0, allocation.vestingSchedule.cliffMonths) : 0,
          vestingMonths: typeof allocation.vestingSchedule.vestingMonths === 'number' ? Math.max(1, allocation.vestingSchedule.vestingMonths) : 12,
          releaseSchedule: ['linear', 'milestone'].includes(allocation.vestingSchedule.releaseSchedule) ? allocation.vestingSchedule.releaseSchedule : 'linear',
          milestones: Array.isArray(allocation.vestingSchedule.milestones)
            ? allocation.vestingSchedule.milestones.map(m => ({
                month: typeof m.month === 'number' ? Math.max(0, m.month) : 0,
                percentage: Math.min(100, Math.max(0, typeof m.percentage === 'number' ? m.percentage : 0)),
                description: String(m.description || '').substring(0, 500),
              }))
            : [],
        }
      : { cliffMonths: 0, vestingMonths: 12, releaseSchedule: 'linear', milestones: [] },
    status: ['draft', 'offered', 'accepted', 'vesting', 'vested', 'rejected'].includes(allocation.status) ? allocation.status : 'draft',
    approvalNotes: String(allocation.approvalNotes || '').substring(0, 1000),
    createdAt: allocation.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    acceptedAt: allocation.acceptedAt || null,
    vestingStartedAt: allocation.vestingStartedAt || null,
  };

  return sanitized;
};

// Sanitize payout
export const sanitizePayout = (payout) => {
  const sanitized = {
    campaignId: String(payout.campaignId || '').trim(),
    testerId: String(payout.testerId || '').trim(),
    submissionId: String(payout.submissionId || '').trim(),
    usdc: Math.max(0, typeof payout.usdc === 'number' ? payout.usdc : 0),
    tokenPercentage: payout.tokenPercentage
      ? Math.min(100, Math.max(0, payout.tokenPercentage))
      : 0,
    status: ['pending', 'processing', 'completed', 'failed'].includes(payout.status) ? payout.status : 'pending',
    circleTransferId: String(payout.circleTransferId || '').trim(),
    transactionHash: String(payout.transactionHash || '').trim(),
    errorMessage: payout.status === 'failed' ? String(payout.errorMessage || '').substring(0, 500) : '',
    createdAt: payout.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: payout.completedAt || null,
  };

  return sanitized;
};

// Calculate vesting progress
export const calculateVestingProgress = (allocation, currentDate = new Date()) => {
  if (allocation.status !== 'vesting' && allocation.status !== 'vested') {
    return { percentage: 0, status: 'not_started' };
  }

  const vestingStartDate = new Date(allocation.vestingStartedAt);
  const { cliffMonths, vestingMonths, releaseSchedule, milestones } = allocation.vestingSchedule;
  
  // Cliff period
  const cliffEndDate = new Date(vestingStartDate);
  cliffEndDate.setMonth(cliffEndDate.getMonth() + cliffMonths);
  
  if (currentDate < cliffEndDate) {
    return { percentage: 0, status: 'cliff' };
  }

  // Vesting period
  const vestingEndDate = new Date(vestingStartDate);
  vestingEndDate.setMonth(vestingEndDate.getMonth() + cliffMonths + vestingMonths);

  if (currentDate >= vestingEndDate) {
    return { percentage: 100, status: 'fully_vested' };
  }

  // Calculate progress based on schedule
  let vestedPercentage = 0;

  if (releaseSchedule === 'linear') {
    const timeSinceCliff = currentDate - cliffEndDate;
    const totalVestingTime = vestingEndDate - cliffEndDate;
    vestedPercentage = (timeSinceCliff / totalVestingTime) * 100;
  } else if (releaseSchedule === 'milestone' && milestones.length > 0) {
    // Milestone-based vesting
    for (const milestone of milestones) {
      const milestoneDate = new Date(vestingStartDate);
      milestoneDate.setMonth(milestoneDate.getMonth() + milestone.month);
      if (currentDate >= milestoneDate) {
        vestedPercentage = milestone.percentage;
      }
    }
  }

  return {
    percentage: Math.round(vestedPercentage * 100) / 100,
    status: 'vesting',
    vestingEndDate: vestingEndDate.toISOString(),
  };
};

// Calculate token value (requires live token price)
export const calculateTokenValue = (tokenPercentage, tokenPrice = 0, totalSupply = 1000000) => {
  if (tokenPrice <= 0 || totalSupply <= 0) {
    return { tokens: 0, value: 0 };
  }

  const tokens = (tokenPercentage / 100) * totalSupply;
  const value = tokens * tokenPrice;

  return {
    tokens: Math.floor(tokens),
    value: Math.round(value * 100) / 100,
  };
};
