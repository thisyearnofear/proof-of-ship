/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/badges/computeBadges', () => ({
  computeLeaderboardBadges: () => [],
}));

vi.mock('@/components/common/ProofBadge', () => ({
  ProofBadgeGroup: () => null,
}));

import ProofBuildersList from './ProofBuildersList';

describe('ProofBuildersList', () => {
  it('renders one row per entry with proof score / evidence / avg proof stats', () => {
    const entries = [
      { id: '1', name: 'alice', score: 95, evidenceCoverage: 88, avgProofScore: 80, proofBackedProjectCount: 3, verifiedWins: 2, totalClaims: 10 },
      { id: '2', name: 'bob', score: 70, evidenceCoverage: 60, avgProofScore: 55, proofBackedProjectCount: 1, verifiedWins: 0, totalClaims: 4 },
    ];
    render(<ProofBuildersList entries={entries} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    // Pluralization on count > 1
    expect(screen.getByText(/3 proof-backed projects/)).toBeInTheDocument();
    expect(screen.getAllByText(/1 proof-backed project/)[0]).toBeInTheDocument();
    // Numbers render
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('uses "Builder" fallback when name is missing', () => {
    const entries = [{ id: '1' }];
    render(<ProofBuildersList entries={entries} />);
    expect(screen.getByText('Builder')).toBeInTheDocument();
  });

  it('renders nothing when entries is empty', () => {
    const { container } = render(<ProofBuildersList entries={[]} />);
    expect(container.querySelector('.space-y-3').children).toHaveLength(0);
  });
});
