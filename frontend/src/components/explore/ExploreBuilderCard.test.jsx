/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/hooks/useFollow.js', () => ({
  default: () => ({ following: false, loading: false, toggleFollow: vi.fn() }),
}));

vi.mock('@/components/common/Toast', () => ({
  useToastActions: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock('@/components/common/Modal', () => ({
  ConfirmModal: () => null,
}));

import ExploreBuilderCard from './ExploreBuilderCard';

const baseBuilder = {
  uid: 'u1',
  displayName: 'Alice Chen',
  githubUsername: 'alicec',
  bio: 'Builder of great things on Base.',
  projectCount: 5,
  totalStars: 100,
  followerCount: 12,
  ecosystems: ['base'],
  averageHealth: 85,
};

describe('ExploreBuilderCard', () => {
  it('renders the display name, handle, and bio', () => {
    render(<ExploreBuilderCard builder={baseBuilder} />);
    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    expect(screen.getByText('@alicec')).toBeInTheDocument();
    expect(screen.getByText('Builder of great things on Base.')).toBeInTheDocument();
  });

  it('renders the project count with singular/plural agreement', () => {
    const { rerender } = render(<ExploreBuilderCard builder={{ ...baseBuilder, projectCount: 1 }} />);
    expect(screen.getByText('1 project')).toBeInTheDocument();
    rerender(<ExploreBuilderCard builder={{ ...baseBuilder, projectCount: 7 }} />);
    expect(screen.getByText('7 projects')).toBeInTheDocument();
  });

  it('hides stars when totalStars is 0', () => {
    render(<ExploreBuilderCard builder={{ ...baseBuilder, totalStars: 0 }} />);
    expect(screen.queryByText('0')).toBeNull();
  });

  it('hides followers when followerCount is 0', () => {
    render(<ExploreBuilderCard builder={{ ...baseBuilder, followerCount: 0 }} />);
    expect(screen.queryByText('0 followers')).toBeNull();
  });

  it('shows "+N more" when there are extra ecosystems', () => {
    render(<ExploreBuilderCard builder={{ ...baseBuilder, ecosystems: ['base', 'celo', 'arbitrum'] }} />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('hides the health pill when averageHealth is 0', () => {
    render(<ExploreBuilderCard builder={{ ...baseBuilder, averageHealth: 0 }} />);
    expect(screen.queryByText('0%')).toBeNull();
  });

  it('uses initials avatar when photoURL is missing', () => {
    const { container } = render(<ExploreBuilderCard builder={baseBuilder} />);
    expect(container.textContent).toContain('AL');
  });

  it('uses photoURL when provided and not errored', () => {
    const { container } = render(<ExploreBuilderCard builder={{ ...baseBuilder, photoURL: 'https://x/y.jpg' }} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://x/y.jpg');
  });

  it('falls back to initials when photoURL errors out', () => {
    const { container } = render(<ExploreBuilderCard builder={{ ...baseBuilder, photoURL: 'https://broken/y.jpg' }} />);
    const img = container.querySelector('img');
    fireEvent.error(img);
    expect(container.textContent).toContain('AL');
  });

  it('invokes onClick when the card is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<ExploreBuilderCard builder={baseBuilder} onClick={onClick} />);
    const card = container.querySelector('.cursor-pointer');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });

  it('hides the follow button when currentUserId is missing', () => {
    render(<ExploreBuilderCard builder={baseBuilder} currentUserId={null} />);
    expect(screen.queryByText(/Follow(ing)?/)).toBeNull();
  });

  it('hides the follow button when viewing yourself', () => {
    render(<ExploreBuilderCard builder={baseBuilder} currentUserId="u1" />);
    expect(screen.queryByText(/Follow(ing)?/)).toBeNull();
  });
});
