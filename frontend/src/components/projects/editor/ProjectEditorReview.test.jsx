/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/common/Card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
}));

import ProjectEditorReview from './ProjectEditorReview';

describe('ProjectEditorReview', () => {
  const baseForm = {
    name: 'AlphaFi',
    description: 'A DeFi protocol on Base.',
    githubUrl: 'https://github.com/org/alphafi',
    category: 'defi',
    website: 'https://alphafi.xyz',
    twitter: '@alphafi',
    discord: 'https://discord.gg/alphafi',
    ecosystem: 'base',
    milestones: ['Launched v1', 'Onboarded 100 users'],
    lookingForFunding: true,
    fundingAmount: '$50k',
  };

  it('renders the title and the form fields', () => {
    render(<ProjectEditorReview form={baseForm} ecosystemConfig={{ shortName: 'Base' }} />);
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    expect(screen.getByText('AlphaFi')).toBeInTheDocument();
    expect(screen.getByText('A DeFi protocol on Base.')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/org/alphafi')).toBeInTheDocument();
    expect(screen.getByText('defi')).toBeInTheDocument();
  });

  it('uses ecosystemConfig.shortName when provided', () => {
    render(<ProjectEditorReview form={baseForm} ecosystemConfig={{ shortName: 'Base' }} />);
    expect(screen.getByText('Base')).toBeInTheDocument();
  });

  it('falls back to form.ecosystem when ecosystemConfig is missing', () => {
    render(<ProjectEditorReview form={baseForm} ecosystemConfig={null} />);
    expect(screen.getByText('base')).toBeInTheDocument();
  });

  it('renders the milestones list', () => {
    render(<ProjectEditorReview form={baseForm} ecosystemConfig={{ shortName: 'Base' }} />);
    expect(screen.getByText('Launched v1')).toBeInTheDocument();
    expect(screen.getByText('Onboarded 100 users')).toBeInTheDocument();
    expect(screen.getByText('Milestones (2)')).toBeInTheDocument();
  });

  it('hides the milestones block when there are no milestones', () => {
    render(<ProjectEditorReview form={{ ...baseForm, milestones: [] }} ecosystemConfig={{ shortName: 'Base' }} />);
    expect(screen.queryByText(/Milestones/)).toBeNull();
  });

  it('filters falsy milestones', () => {
    render(
      <ProjectEditorReview
        form={{ ...baseForm, milestones: ['Keep this', '', null, undefined, 'And this'] }}
        ecosystemConfig={{ shortName: 'Base' }}
      />
    );
    expect(screen.getByText('Keep this')).toBeInTheDocument();
    expect(screen.getByText('And this')).toBeInTheDocument();
    expect(screen.getByText('Milestones (2)')).toBeInTheDocument();
  });

  it('shows the funding block when lookingForFunding is true', () => {
    render(<ProjectEditorReview form={baseForm} ecosystemConfig={{ shortName: 'Base' }} />);
    expect(screen.getByText('Seeking $50k')).toBeInTheDocument();
  });

  it('hides the funding block when lookingForFunding is false', () => {
    render(
      <ProjectEditorReview form={{ ...baseForm, lookingForFunding: false }} ecosystemConfig={{ shortName: 'Base' }} />
    );
    expect(screen.queryByText(/Seeking/)).toBeNull();
  });

  it('falls back to "support" when fundingAmount is missing', () => {
    render(
      <ProjectEditorReview form={{ ...baseForm, fundingAmount: undefined }} ecosystemConfig={{ shortName: 'Base' }} />
    );
    expect(screen.getByText('Seeking support')).toBeInTheDocument();
  });

  it('hides website / twitter / discord fields when missing', () => {
    render(
      <ProjectEditorReview
        form={{ ...baseForm, website: '', twitter: '', discord: '' }}
        ecosystemConfig={{ shortName: 'Base' }}
      />
    );
    expect(screen.queryByText('Website')).toBeNull();
    expect(screen.queryByText('Twitter')).toBeNull();
    expect(screen.queryByText('Discord')).toBeNull();
  });

  it('renders "—" placeholder for missing required fields', () => {
    render(
      <ProjectEditorReview
        form={{ name: '', description: '', githubUrl: '', category: '' }}
        ecosystemConfig={null}
      />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
