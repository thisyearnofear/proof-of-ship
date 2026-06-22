/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockTrackEvent = vi.fn();
vi.mock('@/lib/analytics', () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
}));

vi.mock('next/head', () => ({
  default: () => null,
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ query: { id: 'test-hackathon-1' }, asPath: '/hackathons/test-hackathon-1' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

vi.mock('@/stores/authStore', () => ({
  useUser: () => ({ currentUser: null }),
}));

vi.mock('@/components/common/Card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/common/Button', () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/common/LoadingStates', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock('@/components/ErrorBoundary', () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock('@/components/hackathons/PayoutTimeline', () => ({
  default: () => null,
}));

import HackathonPage from '@/pages/hackathons/[id]';

const mockHackathon = {
  name: 'Test Hackathon',
  ecosystem: 'Ethereum',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  status: 'active',
  prizePool: 50000,
  description: 'A test hackathon',
  participants: [],
};

describe('Hackathon Detail Page — Share Buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockHackathon }),
      })
    );
    window.open = vi.fn();
  });

  it('renders X Share button', async () => {
    render(<HackathonPage />);
    await screen.findByText('Test Hackathon');
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('renders Farcaster Cast button', async () => {
    render(<HackathonPage />);
    await screen.findByText('Test Hackathon');
    expect(screen.getByText('Cast')).toBeInTheDocument();
  });

  it('fires analytics and opens X share link on Share click', async () => {
    render(<HackathonPage />);
    await screen.findByText('Test Hackathon');

    const shareBtn = screen.getByText('Share');
    fireEvent.click(shareBtn);

    expect(mockTrackEvent).toHaveBeenCalledWith('leaderboard_share_clicked', {
      platform: 'x',
      entry_type: 'hackathon',
      entry_name: 'Test Hackathon',
      hackathon_id: 'test-hackathon-1',
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('fires analytics and opens Farcaster share link on Cast click', async () => {
    render(<HackathonPage />);
    await screen.findByText('Test Hackathon');

    const castBtn = screen.getByText('Cast');
    fireEvent.click(castBtn);

    expect(mockTrackEvent).toHaveBeenCalledWith('leaderboard_share_clicked', {
      platform: 'farcaster',
      entry_type: 'hackathon',
      entry_name: 'Test Hackathon',
      hackathon_id: 'test-hackathon-1',
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('warpcast.com/~/compose'),
      '_blank',
      'noopener,noreferrer'
    );
  });
});
