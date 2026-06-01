/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MovementIndicator from './MovementIndicator';

const baseEntry = { id: '1' };

describe('MovementIndicator', () => {
  it('renders an up arrow (chevron) when movement is "up"', () => {
    const { container } = render(<MovementIndicator entry={{ ...baseEntry, movement: 'up' }} />);
    const span = container.querySelector('span[title="Moved up"]');
    expect(span).toBeInTheDocument();
    expect(span.className).toMatch(/text-emerald/);
  });

  it('renders a down arrow (chevron) when movement is "down"', () => {
    const { container } = render(<MovementIndicator entry={{ ...baseEntry, movement: 'down' }} />);
    const span = container.querySelector('span[title="Moved down"]');
    expect(span).toBeInTheDocument();
    expect(span.className).toMatch(/text-red/);
  });

  it('renders a "New" pill when movement is "new"', () => {
    render(<MovementIndicator entry={{ ...baseEntry, movement: 'new' }} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders a stable dot (no title attr) when movement is unset', () => {
    const { container } = render(<MovementIndicator entry={baseEntry} />);
    const titled = container.querySelector('span[title]');
    expect(titled).toBeNull();
  });

  it('renders a stable dot when movement is an unknown value', () => {
    const { container } = render(<MovementIndicator entry={{ ...baseEntry, movement: 'frozen' }} />);
    const titled = container.querySelector('span[title]');
    expect(titled).toBeNull();
  });
});
