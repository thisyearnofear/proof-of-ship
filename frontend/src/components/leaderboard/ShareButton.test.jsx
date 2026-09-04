/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const trackEvent = vi.fn();
vi.mock('@/lib/analytics', () => ({
  trackEvent: (...args) => trackEvent(...args),
}));

import ShareButton from './ShareButton';

describe('ShareButton', () => {
  let openSpy;
  let locationSpy;

  beforeEach(() => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    trackEvent.mockClear();
    locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({ origin: 'https://test.app' });
  });

  afterEach(() => {
    openSpy.mockRestore();
    locationSpy.mockRestore();
  });

  it('renders X and Farcaster share buttons', () => {
    render(<ShareButton entry={{ name: 'alice' }} rank={1} entryType="builder" />);
    expect(screen.getByTitle('Share on X')).toBeInTheDocument();
    expect(screen.getByTitle('Share on Farcaster')).toBeInTheDocument();
  });

  it('clicking the X button calls trackEvent with platform=x', () => {
    render(<ShareButton entry={{ name: 'alice' }} rank={1} entryType="builder" />);
    fireEvent.click(screen.getByTitle('Share on X'));
    expect(trackEvent).toHaveBeenCalledWith(
      'leaderboard_share_clicked',
      expect.objectContaining({ platform: 'x', entry_type: 'builder', rank: 1, entry_name: 'alice' })
    );
  });

  it('clicking the Farcaster button calls trackEvent with platform=farcaster', () => {
    render(<ShareButton entry={{ name: 'bob' }} rank={2} entryType="backer" />);
    fireEvent.click(screen.getByTitle('Share on Farcaster'));
    expect(trackEvent).toHaveBeenCalledWith(
      'leaderboard_share_clicked',
      expect.objectContaining({ platform: 'farcaster', entry_type: 'backer', rank: 2, entry_name: 'bob' })
    );
  });

  it('uses the explicit `text` prop when provided', () => {
    render(<ShareButton text="custom text" entry={{ name: 'a' }} rank={1} entryType="builder" />);
    fireEvent.click(screen.getByTitle('Share on X'));
    const url = openSpy.mock.calls[0][0];
    expect(url).toContain('text=custom%20text');
  });

  it('falls back to generateShareText for builders (entryType="builders") with velocity', () => {
    render(<ShareButton entry={{ name: 'alice', velocity: 99 }} rank={3} entryType="builders" />);
    fireEvent.click(screen.getByTitle('Share on X'));
    const url = openSpy.mock.calls[0][0];
    expect(url).toContain('twitter.com/intent/tweet');
    expect(url).toContain('alice');
    expect(url).toContain('99');
    expect(url).toContain('shipping');
  });

  it('builds a `?ref=` URL with entryType-rank when entryType and rank are provided', () => {
    render(<ShareButton text="t" entry={{ name: 'a' }} rank={5} entryType="project" />);
    fireEvent.click(screen.getByTitle('Share on X'));
    const url = openSpy.mock.calls[0][0];
    // The shareUrl is URL-encoded inside the twitter.com intent URL.
    expect(url).toContain(encodeURIComponent('?ref=project-5'));
  });

  it('uses the explicit `url` prop when provided', () => {
    render(<ShareButton text="t" url="https://custom.example.com/x" entry={{ name: 'a' }} rank={1} entryType="builder" />);
    fireEvent.click(screen.getByTitle('Share on X'));
    const url = openSpy.mock.calls[0][0];
    expect(url).toContain('url=https%3A%2F%2Fcustom.example.com%2Fx');
  });

  it('Farcaster share strips @pledgebond from the text', () => {
    render(<ShareButton text="hello @pledgebond" entry={{ name: 'a' }} rank={1} entryType="builder" />);
    fireEvent.click(screen.getByTitle('Share on Farcaster'));
    const url = openSpy.mock.calls[0][0];
    expect(url).not.toContain('%40pledgebond');
    expect(url).toContain('hello');
  });
});
