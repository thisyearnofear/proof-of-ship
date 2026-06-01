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

import LeaderboardList from './LeaderboardList';

describe('LeaderboardList', () => {
  it('renders one row per entry with rank 1..N', () => {
    const entries = [
      { name: 'alice', address: 'a1' },
      { name: 'bob', address: 'b2' },
      { name: 'carol', address: 'c3' },
    ];
    render(<LeaderboardList entries={entries} type="builders" />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
  });

  it('renders nothing when entries is empty', () => {
    const { container } = render(<LeaderboardList entries={[]} type="builders" />);
    expect(container.querySelector('.space-y-3').children).toHaveLength(0);
  });
});
