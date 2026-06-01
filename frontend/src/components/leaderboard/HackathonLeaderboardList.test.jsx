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

import HackathonLeaderboardList from './HackathonLeaderboardList';

describe('HackathonLeaderboardList', () => {
  it('renders one row per entry', () => {
    const entries = [
      { name: 'ETHGlobal', totalProjects: 50, payoutCompletionRate: 90, score: 95 },
      { name: 'Solana Hyperdrive', totalProjects: 30, payoutCompletionRate: 80, score: 88 },
    ];
    render(<HackathonLeaderboardList entries={entries} />);
    expect(screen.getByText('ETHGlobal')).toBeInTheDocument();
    expect(screen.getByText('Solana Hyperdrive')).toBeInTheDocument();
  });

  it('renders nothing when entries is empty', () => {
    const { container } = render(<HackathonLeaderboardList entries={[]} />);
    expect(container.querySelector('.space-y-3').children).toHaveLength(0);
  });
});
