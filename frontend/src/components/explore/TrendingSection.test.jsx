/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrendingSection from './TrendingSection';

const baseProjects = [
  { slug: 'a', name: 'AlphaFi', ecosystem: 'base', description: 'A top DeFi protocol.', trendingScore: 92, stats: { commits: 120, healthScore: 88 } },
  { slug: 'b', name: 'BetaDAO', ecosystem: 'celo', description: 'A growing DAO.', trendingScore: 75, stats: { commits: 50, healthScore: 70 } },
  { slug: 'c', name: 'GammaSwap', ecosystem: 'arbitrum', description: 'A new DEX.', trendingScore: 60, stats: { commits: 30, healthScore: 55 } },
];

describe('TrendingSection', () => {
  it('renders the heading + 3 project cards', () => {
    render(
      <TrendingSection
        projects={baseProjects}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
    expect(screen.getByText('AlphaFi')).toBeInTheDocument();
    expect(screen.getByText('BetaDAO')).toBeInTheDocument();
    expect(screen.getByText('GammaSwap')).toBeInTheDocument();
  });

  it('renders rank numbers 1, 2, 3 on the project cards', () => {
    const { container } = render(
      <TrendingSection
        projects={baseProjects}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    const rankBadges = container.querySelectorAll('.rounded-full.bg-orange-600');
    expect(rankBadges[0].textContent).toBe('1');
    expect(rankBadges[1].textContent).toBe('2');
    expect(rankBadges[2].textContent).toBe('3');
  });

  it('calls onDismiss when the X button is clicked', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <TrendingSection
        projects={baseProjects}
        onDismiss={onDismiss}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    fireEvent.click(container.querySelector('button[title="Dismiss"]'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('calls onProjectClick with the project when a card is clicked', () => {
    const onProjectClick = vi.fn();
    render(
      <TrendingSection
        projects={baseProjects}
        onDismiss={() => {}}
        onProjectClick={onProjectClick}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    fireEvent.click(screen.getByText('AlphaFi'));
    expect(onProjectClick).toHaveBeenCalledWith(baseProjects[0]);
  });

  it('calls onToggleBookmark(slug) when the bookmark button is clicked', () => {
    const onToggleBookmark = vi.fn();
    const { container } = render(
      <TrendingSection
        projects={baseProjects}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={onToggleBookmark}
      />
    );
    // Bookmark buttons sit next to the trending score badge (no title attr on them).
    const cards = container.querySelectorAll('.grid > .bg-white\\/90, .grid > [class*="bg-white/90"]');
    const firstCardBookmarkBtn = cards[0].querySelectorAll('button')[0];
    fireEvent.click(firstCardBookmarkBtn);
    expect(onToggleBookmark).toHaveBeenCalledWith('a');
  });

  it('shows "Active project" fallback when description is missing', () => {
    render(
      <TrendingSection
        projects={[{ slug: 'a', name: 'A', ecosystem: 'base', trendingScore: 50 }]}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    expect(screen.getByText('Active project')).toBeInTheDocument();
  });

  it('hides commits and healthScore when missing', () => {
    render(
      <TrendingSection
        projects={[{ slug: 'a', name: 'A', ecosystem: 'base', trendingScore: 50 }]}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    expect(screen.queryByText(/commits/)).toBeNull();
    expect(screen.queryByText(/health/)).toBeNull();
  });

  it('uses green dot for trendingScore >= 80', () => {
    const { container } = render(
      <TrendingSection
        projects={[{ slug: 'a', name: 'A', ecosystem: 'base', trendingScore: 90 }]}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    expect(container.innerHTML).toMatch(/bg-green-500/);
  });

  it('uses yellow dot for trendingScore 60-79', () => {
    const { container } = render(
      <TrendingSection
        projects={[{ slug: 'a', name: 'A', ecosystem: 'base', trendingScore: 65 }]}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    expect(container.innerHTML).toMatch(/bg-yellow-500/);
  });

  it('uses orange dot for trendingScore < 60', () => {
    const { container } = render(
      <TrendingSection
        projects={[{ slug: 'a', name: 'A', ecosystem: 'base', trendingScore: 30 }]}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={() => false}
        onToggleBookmark={() => {}}
      />
    );
    expect(container.innerHTML).toMatch(/bg-orange-500/);
  });

  it('shows filled bookmark icon when isBookmarked returns true for a slug', () => {
    const { container } = render(
      <TrendingSection
        projects={baseProjects}
        onDismiss={() => {}}
        onProjectClick={() => {}}
        isBookmarked={(slug) => slug === 'a'}
        onToggleBookmark={() => {}}
      />
    );
    // The bookmark button for slug 'a' has the amber text color class.
    const cards = container.querySelectorAll('.grid > .bg-white\\/90, .grid > [class*="bg-white/90"]');
    const firstCardBookmarkBtn = cards[0].querySelectorAll('button')[0];
    expect(firstCardBookmarkBtn.className).toMatch(/text-amber-500/);
  });
});
