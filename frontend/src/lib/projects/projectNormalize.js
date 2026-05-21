import { parseGitHubRepoUrl } from './githubRepo';

export function generateProjectSlug(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export function cleanTags(tags) {
  if (Array.isArray(tags)) return tags.map(String).map((t) => t.trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function cleanTeamMembers(teamMembers) {
  if (!Array.isArray(teamMembers)) return [];
  return teamMembers
    .map((member) => {
      if (typeof member === 'string') return { address: member.trim(), share: 0 };
      return {
        address: String(member?.address || '').trim(),
        share: Number.parseInt(member?.share, 10) || 0
      };
    })
    .filter((member) => member.address);
}

export function cleanMilestones(milestones) {
  if (!Array.isArray(milestones)) return [];
  return milestones.map((milestone) => String(milestone || '').trim()).filter(Boolean);
}

export function cleanHackathons(hackathons) {
  if (!Array.isArray(hackathons)) return [];
  return hackathons
    .map((hackathon) => ({
      name: String(hackathon?.name || '').trim(),
      url: String(hackathon?.url || '').trim(),
      outcome: String(hackathon?.outcome || '').trim(),
      payoutAt: String(hackathon?.payoutAt || '').trim(),
      notes: String(hackathon?.notes || '').trim()
    }))
    .filter((hackathon) =>
      hackathon.name || hackathon.url || hackathon.outcome || hackathon.payoutAt || hackathon.notes
    );
}

export function normalizeProjectInput(input = {}) {
  const github = parseGitHubRepoUrl(input.githubUrl);

  return {
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    githubUrl: github?.url || String(input.githubUrl || '').trim(),
    owner: github?.owner || input.owner || '',
    repo: github?.repo || input.repo || '',
    ecosystem: String(input.ecosystem || '').trim(),
    category: String(input.category || '').trim(),
    otherCategoryDetail: input.category === 'other' ? String(input.otherCategoryDetail || '').trim() : null,
    contractAddress: String(input.contractAddress || '').trim(),
    deploymentTxHash: String(input.deploymentTxHash || '').trim() || null,
    liveUrl: String(input.liveUrl || '').trim() || null,
    website: String(input.website || '').trim() || null,
    twitter: String(input.twitter || '').trim() || null,
    discord: String(input.discord || '').trim() || null,
    imageUrl: input.imageUrl || null,
    teamMembers: cleanTeamMembers(input.teamMembers),
    tags: cleanTags(input.tags),
    isOpenSource: Boolean(input.isOpenSource),
    lookingForFunding: Boolean(input.lookingForFunding),
    fundingAmount: input.lookingForFunding ? input.fundingAmount || null : null,
    milestones: cleanMilestones(input.milestones),
    hackathons: cleanHackathons(input.hackathons),
    launchOnBags: Boolean(input.launchOnBags),
    bagsTokenMetadata: input.bagsTokenMetadata || null
  };
}

export function validateProjectInput(project) {
  const errors = [];

  if (!project.name) errors.push('Project name is required');
  if (!project.description) errors.push('Description is required');
  if (!parseGitHubRepoUrl(project.githubUrl)) errors.push('A valid GitHub URL is required');
  if (!project.ecosystem) errors.push('Chain / ecosystem is required');
  if (!project.category) errors.push('Category is required');
  if (project.category === 'other' && !project.otherCategoryDetail) {
    errors.push('Please specify what kind of project this is');
  }
  if (project.contractAddress && !project.contractAddress.startsWith('0x')) {
    errors.push('Contract address must start with 0x');
  }

  const members = cleanTeamMembers(project.teamMembers);
  const totalShares = members.reduce((sum, member) => sum + member.share, 0);
  if (members.length > 0 && totalShares !== 100) {
    errors.push(`Total team shares must equal 100% (currently ${totalShares}%)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createProjectDocument(input, userId, options = {}) {
  const normalized = normalizeProjectInput(input);
  const now = options.now || new Date().toISOString();
  const slug = options.slug || generateProjectSlug(normalized.name);

  return {
    slug,
    ...normalized,
    liveUrl: normalized.liveUrl || normalized.website,
    submittedBy: userId,
    owners: Array.isArray(options.owners) && options.owners.length ? options.owners : [userId].filter(Boolean),
    submittedAt: options.submittedAt || now,
    status: options.status || 'pending_review',
    createdAt: options.createdAt || now,
    updatedAt: now,
    verified: Boolean(options.verified),
    featured: Boolean(options.featured),
    stats: {
      views: 0,
      stars: 0,
      forks: 0,
      commits: 0,
      issues: 0,
      pulls: 0,
      velocity: 5 + normalized.milestones.length * 10,
      ...(options.stats || {})
    }
  };
}
