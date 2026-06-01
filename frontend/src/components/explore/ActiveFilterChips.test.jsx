/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveFilterChips from './ActiveFilterChips';

describe('ActiveFilterChips', () => {
  it('returns null when filters is empty', () => {
    const { container } = render(<ActiveFilterChips filters={[]} onRemove={() => {}} onClearAll={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when filters is undefined', () => {
    const { container } = render(<ActiveFilterChips onRemove={() => {}} onClearAll={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a chip for each filter with its label', () => {
    render(
      <ActiveFilterChips
        filters={[{ key: 'cat', label: 'DeFi' }, { key: 'eco', label: 'Base' }]}
        onRemove={() => {}}
        onClearAll={() => {}}
      />
    );
    expect(screen.getByText('DeFi')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
  });

  it('clicking the chip X button calls onRemove with the filter key', () => {
    const onRemove = vi.fn();
    const { container } = render(
      <ActiveFilterChips
        filters={[{ key: 'cat', label: 'DeFi' }, { key: 'eco', label: 'Base' }]}
        onRemove={onRemove}
        onClearAll={() => {}}
      />
    );
    const removeButtons = container.querySelectorAll('button');
    const firstChipButton = removeButtons[0];
    fireEvent.click(firstChipButton);
    expect(onRemove).toHaveBeenCalledWith('cat');
  });

  it('clicking "Clear all" calls onClearAll', () => {
    const onClearAll = vi.fn();
    render(
      <ActiveFilterChips
        filters={[{ key: 'cat', label: 'DeFi' }]}
        onRemove={() => {}}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByText('Clear all'));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('renders the "Filters:" prefix label', () => {
    render(
      <ActiveFilterChips
        filters={[{ key: 'cat', label: 'DeFi' }]}
        onRemove={() => {}}
        onClearAll={() => {}}
      />
    );
    expect(screen.getByText('Filters:')).toBeInTheDocument();
  });
});
