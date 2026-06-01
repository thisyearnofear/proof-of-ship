/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExploreProjectListItem from './ExploreProjectListItem';

const baseProject = {
  slug: 'alphafi',
  name: 'AlphaFi',
  ecosystem: 'base',
  description: 'A DeFi protocol.',
  stats: { commits: 50, stars: 12 },
  lookingForFunding: true,
  category: 'defi',
};

describe('ExploreProjectListItem', () => {
  it('renders the name, ecosystem, description, and stats', () => {
    render(<ExploreProjectListItem project={baseProject} />);
    expect(screen.getByText('AlphaFi')).toBeInTheDocument();
    expect(screen.getByText('A DeFi protocol.')).toBeInTheDocument();
    expect(screen.getByText('50 commits')).toBeInTheDocument();
    expect(screen.getByText('12 ★')).toBeInTheDocument();
  });

  it('renders the Funding badge when lookingForFunding is true', () => {
    render(<ExploreProjectListItem project={baseProject} />);
    expect(screen.getByText('Funding')).toBeInTheDocument();
  });

  it('hides the Funding badge when lookingForFunding is false', () => {
    render(<ExploreProjectListItem project={{ ...baseProject, lookingForFunding: false }} />);
    expect(screen.queryByText('Funding')).toBeNull();
  });

  it('hides commits and stars when counts are 0', () => {
    render(
      <ExploreProjectListItem project={{ ...baseProject, stats: { commits: 0, stars: 0 } }} />
    );
    expect(screen.queryByText(/commits/)).toBeNull();
    expect(screen.queryByText('★')).toBeNull();
  });

  it('renders an image when imageUrl is provided', () => {
    const { container } = render(
      <ExploreProjectListItem project={{ ...baseProject, imageUrl: 'https://x/y.jpg' }} />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://x/y.jpg');
  });

  it('invokes onClick when the card is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ExploreProjectListItem project={baseProject} onClick={onClick} />
    );
    const card = container.querySelector('.cursor-pointer');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });

  it('bookmark click invokes onToggleBookmark without triggering onClick', () => {
    const onClick = vi.fn();
    const onToggleBookmark = vi.fn();
    const { container } = render(
      <ExploreProjectListItem project={baseProject} isBookmarked={false} onToggleBookmark={onToggleBookmark} onClick={onClick} />
    );
    const btn = container.querySelector('button[title="Bookmark project"]');
    fireEvent.click(btn);
    expect(onToggleBookmark).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows the filled bookmark when isBookmarked is true', () => {
    const { container } = render(
      <ExploreProjectListItem project={baseProject} isBookmarked={true} onToggleBookmark={() => {}} />
    );
    const btn = container.querySelector('button[title="Remove bookmark"]');
    expect(btn).toBeInTheDocument();
  });

  it('shows the category text when present', () => {
    render(<ExploreProjectListItem project={baseProject} />);
    expect(screen.getByText('· defi')).toBeInTheDocument();
  });
});
