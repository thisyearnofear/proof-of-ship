import { isGitHubRepoUrl } from './githubRepo';

const QUALITY_ITEMS = [
  {
    id: 'name',
    label: 'Project name',
    weight: 8,
    isDone: (project) => Boolean(project.name?.trim()),
    action: 'Add a concise project name.'
  },
  {
    id: 'description',
    label: 'Clear description',
    weight: 16,
    isDone: (project) => String(project.description || '').trim().length >= 80,
    action: 'Explain what it does, who it serves, and what is onchain.'
  },
  {
    id: 'github',
    label: 'GitHub repo',
    weight: 14,
    isDone: (project) => isGitHubRepoUrl(project.githubUrl),
    action: 'Connect a public GitHub repository.'
  },
  {
    id: 'image',
    label: 'Project image',
    weight: 10,
    isDone: (project) => Boolean(project.imageUrl),
    action: 'Upload a product screenshot, demo image, or architecture visual.'
  },
  {
    id: 'liveUrl',
    label: 'Live demo',
    weight: 10,
    isDone: (project) => Boolean(project.liveUrl || project.website),
    action: 'Add a live app, landing page, docs, or demo link.'
  },
  {
    id: 'milestones',
    label: 'Milestones',
    weight: 14,
    isDone: (project) => Array.isArray(project.milestones) && project.milestones.some((m) => String(m).trim().length >= 12),
    action: 'Add concrete, trackable milestones.'
  },
  {
    id: 'proof',
    label: 'Onchain proof',
    weight: 10,
    isDone: (project) => Boolean(project.contractAddress || project.deploymentTxHash || project.solanaProjectPda),
    action: 'Add a contract address, deployment transaction, or program address.'
  },
  {
    id: 'social',
    label: 'Social proof',
    weight: 8,
    isDone: (project) => Boolean(project.twitter || project.discord),
    action: 'Add a builder X/Twitter profile or community Discord.'
  },
  {
    id: 'team',
    label: 'Builder identity',
    weight: 5,
    isDone: (project) => Array.isArray(project.teamMembers) && project.teamMembers.length > 0,
    action: 'Add team member wallet or GitHub identities.'
  },
  {
    id: 'category',
    label: 'Category',
    weight: 5,
    isDone: (project) => Boolean(project.category),
    action: 'Choose the category backers should find you under.'
  }
];

export function getProjectQuality(project = {}) {
  const items = QUALITY_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    weight: item.weight,
    done: item.isDone(project),
    action: item.action
  }));

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items
    .filter((item) => item.done)
    .reduce((sum, item) => sum + item.weight, 0);
  const score = Math.round((completedWeight / totalWeight) * 100);

  return {
    score,
    items,
    missing: items.filter((item) => !item.done),
    completed: items.filter((item) => item.done),
    tier: score >= 85 ? 'Launch-ready' : score >= 65 ? 'Strong' : score >= 40 ? 'Needs polish' : 'Draft'
  };
}

export function getProjectNextActions(project = {}, limit = 4) {
  return getProjectQuality(project).missing.slice(0, limit);
}

