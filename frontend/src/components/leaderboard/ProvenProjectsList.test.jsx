/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/badges/computeBadges', () => ({
  computeLeaderboardBadges: () => [],
}));

vi.mock('@/components/common/ProofBadge', () => ({
  ProofBadgeGroup: () => null,
}));

import ProvenProjectsList from './ProvenProjectsList';

describe('ProvenProjectsList', () => {
  it('renders one row per entry with project stats', () => {
    const entries = [
      { slug: 'a', name: 'alphafi', ecosystem: 'base', score: 92, evidenceCoverage: 80, avgProofScore: 75, verifiedWins: 2, evidenceBackedClaims: 5, totalClaims: 6 },
      { slug: 'b', name: 'betadao', ecosystem: 'celo', score: 70, evidenceCoverage: 50, avgProofScore: 50, verifiedWins: 0, evidenceBackedClaims: 0, totalClaims: 0 },
    ];
    render(<ProvenProjectsList entries={entries} />);
    expect(screen.getByText('alphafi')).toBeInTheDocument();
    expect(screen.getByText('betadao')).toBeInTheDocument();
    expect(screen.getByText(/5\/6 evidence-backed claims/)).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('renders a project link when entry has a slug', () => {
    const entries = [{ slug: 'alphafi', name: 'a', ecosystem: 'base' }];
    render(<ProvenProjectsList entries={entries} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/projects/base/alphafi');
  });

  it('does not render a project link when slug is missing', () => {
    const entries = [{ name: 'a', ecosystem: 'base' }];
    render(<ProvenProjectsList entries={entries} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders nothing when entries is empty', () => {
    const { container } = render(<ProvenProjectsList entries={[]} />);
    expect(container.querySelector('.space-y-3').children).toHaveLength(0);
  });
});
