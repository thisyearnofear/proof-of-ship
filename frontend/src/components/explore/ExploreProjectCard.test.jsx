/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExploreProjectCard from './ExploreProjectCard';

const baseProject = {
  slug: 'alphafi',
  name: 'AlphaFi',
  ecosystem: 'base',
  category: 'defi',
  description: 'A decentralized finance protocol.',
  tags: ['defi', 'lending', 'yield', 'bonus'],
  stats: { commits: 120, stars: 30 },
  lookingForFunding: true,
};

describe('ExploreProjectCard', () => {
  it('renders the name, ecosystem, category, and description', () => {
    render(<ExploreProjectCard project={baseProject} />);
    expect(screen.getByText('AlphaFi')).toBeInTheDocument();
    expect(screen.getByText('defi')).toBeInTheDocument();
    expect(screen.getByText('A decentralized finance protocol.')).toBeInTheDocument();
  });

  it('renders the project image when imageUrl is provided', () => {
    const { container } = render(
      <ExploreProjectCard project={{ ...baseProject, imageUrl: 'https://x/y.jpg' }} />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://x/y.jpg');
  });

  it('hides the image when imageUrl is missing', () => {
    const { container } = render(<ExploreProjectCard project={baseProject} />);
    const img = container.querySelector('img[alt="AlphaFi"]');
    expect(img).toBeNull();
  });

  it('renders only the first 3 tags and shows +N for extras', () => {
    render(<ExploreProjectCard project={baseProject} />);
    expect(screen.getByText('defi')).toBeInTheDocument();
    expect(screen.getByText('lending')).toBeInTheDocument();
    expect(screen.getByText('yield')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('hides the tags row when no tags', () => {
    const { container } = render(
      <ExploreProjectCard project={{ ...baseProject, tags: undefined }} />
    );
    expect(container.querySelector('.flex-wrap.gap-1')).toBeNull();
  });

  it('renders the "Funding" label when lookingForFunding is true', () => {
    render(<ExploreProjectCard project={baseProject} />);
    expect(screen.getByText('Funding')).toBeInTheDocument();
  });

  it('hides the Funding label when lookingForFunding is false', () => {
    render(<ExploreProjectCard project={{ ...baseProject, lookingForFunding: false }} />);
    expect(screen.queryByText('Funding')).toBeNull();
  });

  it('renders commits and stars when present', () => {
    render(<ExploreProjectCard project={baseProject} />);
    expect(screen.getByText('120 commits')).toBeInTheDocument();
    expect(screen.getByText('30 ★')).toBeInTheDocument();
  });

  it('hides stats when counts are 0', () => {
    render(
      <ExploreProjectCard project={{ ...baseProject, stats: { commits: 0, stars: 0 } }} />
    );
    expect(screen.queryByText(/commits/)).toBeNull();
    expect(screen.queryByText('★')).toBeNull();
  });

  it('invokes onClick when card is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<ExploreProjectCard project={baseProject} onClick={onClick} />);
    const card = container.querySelector('.cursor-pointer');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });

  it('clicking the bookmark button invokes onToggleBookmark (without triggering onClick)', () => {
    const onClick = vi.fn();
    const onToggleBookmark = vi.fn();
    const { container } = render(
      <ExploreProjectCard project={baseProject} isBookmarked={false} onToggleBookmark={onToggleBookmark} onClick={onClick} />
    );
    const btn = container.querySelector('button[title="Bookmark project"]');
    fireEvent.click(btn);
    expect(onToggleBookmark).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows the filled bookmark when isBookmarked is true', () => {
    const { container } = render(
      <ExploreProjectCard project={baseProject} isBookmarked={true} onToggleBookmark={() => {}} />
    );
    const btn = container.querySelector('button[title="Remove bookmark"]');
    expect(btn).toBeInTheDocument();
  });
});
