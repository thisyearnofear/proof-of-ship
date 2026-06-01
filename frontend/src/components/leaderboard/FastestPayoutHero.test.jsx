/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FastestPayoutHero from './FastestPayoutHero';

describe('FastestPayoutHero', () => {
  it('returns null when no entries have payout data', () => {
    const { container } = render(
      <FastestPayoutHero entries={[{ name: 'a', avgPayoutDays: null }, { name: 'b' }]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the fastest-payout entry as the hero', () => {
    const entries = [
      { name: 'ETHGlobal', avgPayoutDays: 5, payoutCompletionRate: 90, builderCount: 50, totalPrizeAmount: 100000 },
      { name: 'Solana Hack', avgPayoutDays: 14, payoutCompletionRate: 75, builderCount: 30, totalPrizeAmount: 50000 },
    ];
    const { container } = render(<FastestPayoutHero entries={entries} />);
    expect(screen.getByText('ETHGlobal')).toBeInTheDocument();
    expect(container.textContent).toMatch(/Pays winners in/);
    expect(container.textContent).toMatch(/5 days/);
  });

  it('shows the runner-up when there are 2+ entries with speed data', () => {
    const entries = [
      { name: 'ETHGlobal', avgPayoutDays: 5, payoutCompletionRate: 90, builderCount: 50 },
      { name: 'Solana Hack', avgPayoutDays: 14, payoutCompletionRate: 75, builderCount: 30 },
    ];
    render(<FastestPayoutHero entries={entries} />);
    expect(screen.getByText('Solana Hack')).toBeInTheDocument();
  });

  it('hides the runner-up when only one entry has speed data', () => {
    const entries = [
      { name: 'ETHGlobal', avgPayoutDays: 5, payoutCompletionRate: 90, builderCount: 50 },
      { name: 'NoData', avgPayoutDays: null, payoutCompletionRate: 0, builderCount: 0 },
    ];
    render(<FastestPayoutHero entries={entries} />);
    expect(screen.queryByText('NoData')).toBeNull();
  });

  it('renders total prizes in $k when totalPrizeAmount > 0', () => {
    const entries = [{ name: 'A', avgPayoutDays: 3, payoutCompletionRate: 95, totalPrizeAmount: 250000 }];
    render(<FastestPayoutHero entries={entries} />);
    expect(screen.getByText('$250k')).toBeInTheDocument();
  });

  it('renders total prizes as "—" when totalPrizeAmount is 0/missing', () => {
    const entries = [{ name: 'A', avgPayoutDays: 3, payoutCompletionRate: 95, totalPrizeAmount: 0 }];
    render(<FastestPayoutHero entries={entries} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('uses green color for payoutCompletionRate >= 80', () => {
    const entries = [{ name: 'A', avgPayoutDays: 3, payoutCompletionRate: 90, totalPrizeAmount: 0 }];
    const { container } = render(<FastestPayoutHero entries={entries} />);
    expect(container.innerHTML).toMatch(/text-green-700/);
  });

  it('uses amber color for payoutCompletionRate 50-79', () => {
    const entries = [{ name: 'A', avgPayoutDays: 3, payoutCompletionRate: 60, totalPrizeAmount: 0 }];
    const { container } = render(<FastestPayoutHero entries={entries} />);
    expect(container.innerHTML).toMatch(/text-amber-700/);
  });

  it('uses red color for payoutCompletionRate < 50', () => {
    const entries = [{ name: 'A', avgPayoutDays: 3, payoutCompletionRate: 30, totalPrizeAmount: 0 }];
    const { container } = render(<FastestPayoutHero entries={entries} />);
    expect(container.innerHTML).toMatch(/text-red-700/);
  });

  it('skips payout-rate phrase when payoutCompletionRate is 0', () => {
    const entries = [{ name: 'A', avgPayoutDays: 3, payoutCompletionRate: 0, totalPrizeAmount: 0 }];
    const { container } = render(<FastestPayoutHero entries={entries} />);
    expect(container.textContent).not.toMatch(/payout rate/);
  });
});
