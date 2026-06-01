/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplorePagination from './ExplorePagination';

describe('ExplorePagination — pageNumbers (via rendered output)', () => {
  it('returns null when totalPages is 1', () => {
    const { container } = render(
      <ExplorePagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <ExplorePagination currentPage={1} totalPages={0} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders every page button when totalPages <= 7', () => {
    render(
      <ExplorePagination currentPage={1} totalPages={5} onPageChange={() => {}} />
    );
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders pages 1-7 when on page 4 of 20 (lower bound)', () => {
    render(
      <ExplorePagination currentPage={4} totalPages={20} onPageChange={() => {}} />
    );
    for (let i = 1; i <= 7; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders the last 7 pages when near the end', () => {
    render(
      <ExplorePagination currentPage={18} totalPages={20} onPageChange={() => {}} />
    );
    for (let i = 14; i <= 20; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('renders a 7-page window around the current page (mid range)', () => {
    render(
      <ExplorePagination currentPage={10} totalPages={20} onPageChange={() => {}} />
    );
    for (let i = 7; i <= 13; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });
});

describe('ExplorePagination — interactions', () => {
  it('clicking Previous calls onPageChange with currentPage - 1', () => {
    const onPageChange = vi.fn();
    render(
      <ExplorePagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('clicking Previous at page 1 is a no-op (button is disabled, click suppressed)', () => {
    const onPageChange = vi.fn();
    render(
      <ExplorePagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    expect(prevBtn).toBeDisabled();
    fireEvent.click(prevBtn);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('clicking Next calls onPageChange with currentPage + 1', () => {
    const onPageChange = vi.fn();
    render(
      <ExplorePagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('clicking Next at the last page is a no-op (button is disabled, click suppressed)', () => {
    const onPageChange = vi.fn();
    render(
      <ExplorePagination currentPage={5} totalPages={5} onPageChange={onPageChange} />
    );
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeDisabled();
    fireEvent.click(nextBtn);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('clicking a numbered page button calls onPageChange with that page', () => {
    const onPageChange = vi.fn();
    render(
      <ExplorePagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('scrolls to resultsRef when resultsRef is provided', () => {
    const scrollIntoView = vi.fn();
    const ref = { current: { scrollIntoView } };
    render(
      <ExplorePagination currentPage={2} totalPages={5} onPageChange={() => {}} resultsRef={ref} />
    );
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
