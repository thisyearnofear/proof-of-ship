/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/badges/computeBadges', () => ({
  computeLeaderboardBadges: () => [],
}));

vi.mock('@/components/common/ProofBadge', () => ({
  ProofBadgeGroup: () => null,
}));

import HackathonLeaderboardList from './HackathonLeaderboardList';

const mockEntries = [
  { name: 'ETHGlobal', ecosystem: 'ethereum', totalProjects: 50, payoutCompletionRate: 90, score: 95 },
  { name: 'Solana Hyperdrive', ecosystem: 'solana', totalProjects: 30, payoutCompletionRate: 80, score: 88 },
];

describe('HackathonLeaderboardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton rows when entries is null', () => {
    const { container } = render(<HackathonLeaderboardList entries={null} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(5);
  });

  it('renders skeleton rows when entries is undefined', () => {
    const { container } = render(<HackathonLeaderboardList />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(5);
  });

  it('renders one row per entry', () => {
    render(<HackathonLeaderboardList entries={mockEntries} />);
    expect(screen.getByText('ETHGlobal')).toBeInTheDocument();
    expect(screen.getByText('Solana Hyperdrive')).toBeInTheDocument();
  });

  it('renders empty state when entries is empty array', () => {
    render(<HackathonLeaderboardList entries={[]} />);
    expect(screen.getByText('No hackathons found')).toBeInTheDocument();
  });

  it('filters entries by name on search', () => {
    render(<HackathonLeaderboardList entries={mockEntries} />);

    const searchInput = screen.getByPlaceholderText('Search hackathons by name or ecosystem...');
    fireEvent.change(searchInput, { target: { value: 'solana' } });

    expect(screen.queryByText('ETHGlobal')).not.toBeInTheDocument();
    expect(screen.getByText('Solana Hyperdrive')).toBeInTheDocument();
  });

  it('filters entries by ecosystem on search', () => {
    render(<HackathonLeaderboardList entries={mockEntries} />);

    const searchInput = screen.getByPlaceholderText('Search hackathons by name or ecosystem...');
    fireEvent.change(searchInput, { target: { value: 'ethereum' } });

    expect(screen.getByText('ETHGlobal')).toBeInTheDocument();
    expect(screen.queryByText('Solana Hyperdrive')).not.toBeInTheDocument();
  });

  it('shows no results message when search matches nothing', () => {
    render(<HackathonLeaderboardList entries={mockEntries} />);

    const searchInput = screen.getByPlaceholderText('Search hackathons by name or ecosystem...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText(/no hackathons match/i)).toBeInTheDocument();
  });

  it('clears search when X button is clicked', () => {
    const { container } = render(<HackathonLeaderboardList entries={mockEntries} />);

    const searchInput = screen.getByPlaceholderText('Search hackathons by name or ecosystem...');
    fireEvent.change(searchInput, { target: { value: 'solana' } });
    expect(screen.queryByText('ETHGlobal')).not.toBeInTheDocument();

    const clearBtn = container.querySelector('.absolute.right-2');
    fireEvent.click(clearBtn);

    expect(screen.getByText('ETHGlobal')).toBeInTheDocument();
    expect(screen.getByText('Solana Hyperdrive')).toBeInTheDocument();
  });
});
