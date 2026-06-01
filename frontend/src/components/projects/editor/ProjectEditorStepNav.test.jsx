/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/common/Button', () => ({
  default: ({ children, onClick, type, variant }) => (
    <button onClick={onClick} type={type} data-variant={variant}>{children}</button>
  ),
}));

import ProjectEditorStepNav from './ProjectEditorStepNav';

describe('ProjectEditorStepNav', () => {
  it('renders the 3 wizard steps', () => {
    render(<ProjectEditorStepNav wizardStep={1} setWizardStep={() => {}} />);
    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('Proof & Polish')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  it('shows Continue button and hides Back button on step 1', () => {
    render(<ProjectEditorStepNav wizardStep={1} setWizardStep={() => {}} />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('shows Back button on step > 1', () => {
    render(<ProjectEditorStepNav wizardStep={2} setWizardStep={() => {}} />);
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('clicking Continue calls setWizardStep with current + 1', () => {
    const setWizardStep = vi.fn();
    render(<ProjectEditorStepNav wizardStep={2} setWizardStep={setWizardStep} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(setWizardStep).toHaveBeenCalledWith(3);
  });

  it('clicking Back calls setWizardStep with current - 1', () => {
    const setWizardStep = vi.fn();
    render(<ProjectEditorStepNav wizardStep={2} setWizardStep={setWizardStep} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(setWizardStep).toHaveBeenCalledWith(1);
  });

  it('clicking a step indicator (previous step) jumps back to that step', () => {
    const setWizardStep = vi.fn();
    render(<ProjectEditorStepNav wizardStep={3} setWizardStep={setWizardStep} />);
    const basicsBtn = screen.getByText('Basics').closest('button');
    fireEvent.click(basicsBtn);
    expect(setWizardStep).toHaveBeenCalledWith(1);
  });

  it('clicking a future step indicator (current step + 1) is a no-op', () => {
    const setWizardStep = vi.fn();
    render(<ProjectEditorStepNav wizardStep={1} setWizardStep={setWizardStep} />);
    const reviewBtn = screen.getByText('Review & Submit').closest('button');
    fireEvent.click(reviewBtn);
    expect(setWizardStep).not.toHaveBeenCalled();
  });

  it('hides Continue/Back when showContinue is false', () => {
    render(<ProjectEditorStepNav wizardStep={2} setWizardStep={() => {}} showContinue={false} />);
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });
});
