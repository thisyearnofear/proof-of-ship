/**
 * Pure funding-amount calculation.
 *
 * Lives in its own module — with NO server-only or Circle SDK imports —
 * so it can be safely imported from client components.
 */

const MIN_SCORE = 400;
const MAX_SCORE = 800;
const MIN_FUNDING = 500;
const MAX_FUNDING = 5000;

export function calculateFundingAmount(creditScore: number): number {
  if (creditScore < MIN_SCORE) return 0;
  if (creditScore >= MAX_SCORE) return MAX_FUNDING;

  const range = MAX_FUNDING - MIN_FUNDING;
  const scoreRange = MAX_SCORE - MIN_SCORE;
  const adjustedScore = creditScore - MIN_SCORE;

  return Math.floor(MIN_FUNDING + (range * adjustedScore) / scoreRange);
}
