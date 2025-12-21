/**
 * Data validation schemas for projects and GitHub data
 * Using a lightweight validation approach without external dependencies
 */

// Project validation schema
export const validateProject = (project) => {
  const errors = [];

  // Required fields
  if (!project.id || typeof project.id !== 'string') {
    errors.push('Project ID is required and must be a string');
  }

  if (!project.name || typeof project.name !== 'string' || project.name.length < 1) {
    errors.push('Project name is required and must be a non-empty string');
  }

  if (project.name && project.name.length > 100) {
    errors.push('Project name must be 100 characters or less');
  }

  if (project.description && typeof project.description !== 'string') {
    errors.push('Project description must be a string');
  }

  if (project.description && project.description.length > 500) {
    errors.push('Project description must be 500 characters or less');
  }

  // Validate owners array
  if (!Array.isArray(project.owners) || project.owners.length === 0) {
    errors.push('Project must have at least one owner');
  } else {
    project.owners.forEach((owner, index) => {
      if (typeof owner !== 'string') {
        errors.push(`Owner at index ${index} must be a string`);
      }
    });
  }

  // Validate sectors if present
  if (project.sectors && Array.isArray(project.sectors)) {
    const validSectors = ['defi', 'gaming', 'rwa', 'health', 'infrastructure', 'social', 'nft', 'dao', 'marketplace', 'bridge'];
    project.sectors.forEach((sector, index) => {
      if (typeof sector !== 'string') {
        errors.push(`Sector at index ${index} must be a string`);
      } else if (!validSectors.includes(sector.toLowerCase())) {
        errors.push(`Sector "${sector}" is not valid. Must be one of: ${validSectors.join(', ')}`);
      }
    });
  }

  // Validate chains if present
  if (project.chains && Array.isArray(project.chains)) {
    const validChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc', 'gnosis', 'celo', 'solana'];
    project.chains.forEach((chain, index) => {
      if (typeof chain !== 'string') {
        errors.push(`Chain at index ${index} must be a string`);
      } else if (!validChains.includes(chain.toLowerCase())) {
        errors.push(`Chain "${chain}" is not valid. Must be one of: ${validChains.join(', ')}`);
      }
    });
  }

  // Validate contracts if present
  if (project.contracts && Array.isArray(project.contracts)) {
    project.contracts.forEach((contract, index) => {
      if (!contract.address || typeof contract.address !== 'string') {
        errors.push(`Contract at index ${index} must have a valid address`);
      }

      if (contract.address && !/^0x[a-fA-F0-9]{40}$/.test(contract.address)) {
        errors.push(`Contract at index ${index} has invalid Ethereum address format`);
      }

      if (!contract.chain || typeof contract.chain !== 'string') {
        errors.push(`Contract at index ${index} must specify a chain`);
      }

      const validTypes = ['ERC20', 'ERC721', 'ERC1155', 'Custom'];
      if (contract.type && !validTypes.includes(contract.type)) {
        errors.push(`Contract at index ${index} has invalid type. Must be one of: ${validTypes.join(', ')}`);
      }
    });
  }

  // Validate contractAddresses map if present
  if (project.contractAddresses && typeof project.contractAddresses === 'object') {
    Object.entries(project.contractAddresses).forEach(([chain, address]) => {
      if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        errors.push(`contractAddresses["${chain}"] must be a valid Ethereum address`);
      }
    });
  }

  // Validate repositories if present
  if (project.repositories && Array.isArray(project.repositories)) {
    project.repositories.forEach((repo, index) => {
      if (!repo.owner || typeof repo.owner !== 'string') {
        errors.push(`Repository at index ${index} must have an owner`);
      }

      if (!repo.repo || typeof repo.repo !== 'string') {
        errors.push(`Repository at index ${index} must have a repo name`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// GitHub data validation
export const validateGitHubData = (data, type) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push(`${type} data must be an object`);
    return { isValid: false, errors };
  }

  switch (type) {
    case 'issues':
      if (!Array.isArray(data)) {
        errors.push('Issues data must be an array');
      } else {
        data.forEach((issue, index) => {
          if (!issue.id || typeof issue.id !== 'number') {
            errors.push(`Issue at index ${index} must have a numeric ID`);
          }
          if (!issue.title || typeof issue.title !== 'string') {
            errors.push(`Issue at index ${index} must have a title`);
          }
          if (!issue.state || !['open', 'closed'].includes(issue.state)) {
            errors.push(`Issue at index ${index} must have valid state (open/closed)`);
          }
        });
      }
      break;

    case 'prs':
      if (!Array.isArray(data)) {
        errors.push('PRs data must be an array');
      } else {
        data.forEach((pr, index) => {
          if (!pr.id || typeof pr.id !== 'number') {
            errors.push(`PR at index ${index} must have a numeric ID`);
          }
          if (!pr.title || typeof pr.title !== 'string') {
            errors.push(`PR at index ${index} must have a title`);
          }
          if (!pr.state || !['open', 'closed', 'merged'].includes(pr.state)) {
            errors.push(`PR at index ${index} must have valid state (open/closed/merged)`);
          }
        });
      }
      break;

    case 'commits':
      if (!Array.isArray(data)) {
        errors.push('Commits data must be an array');
      } else {
        data.forEach((commit, index) => {
          if (!commit.week || typeof commit.week !== 'number') {
            errors.push(`Commit data at index ${index} must have a week timestamp`);
          }
          if (typeof commit.total !== 'number') {
            errors.push(`Commit data at index ${index} must have a total count`);
          }
        });
      }
      break;

    case 'meta':
      if (!data.updatedAt) {
        errors.push('Meta data must have updatedAt timestamp');
      }
      if (data.updatedAt && isNaN(new Date(data.updatedAt).getTime())) {
        errors.push('Meta data updatedAt must be a valid date');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize project data
export const sanitizeProject = (project) => {
  const validSectors = ['defi', 'gaming', 'rwa', 'health', 'infrastructure', 'social', 'nft', 'dao', 'marketplace', 'bridge'];
  const validChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc', 'gnosis', 'celo', 'solana'];

  const sanitized = {
    id: String(project.id || '').trim(),
    name: String(project.name || '').trim().substring(0, 100),
    description: String(project.description || '').trim().substring(0, 500),
    owners: Array.isArray(project.owners) 
      ? project.owners.filter(owner => typeof owner === 'string' && owner.trim())
      : [],
    sectors: Array.isArray(project.sectors)
      ? project.sectors.filter(sector => validSectors.includes(sector.toLowerCase()))
      : [],
    chains: Array.isArray(project.chains)
      ? project.chains.filter(chain => validChains.includes(chain.toLowerCase()))
      : [],
    contracts: Array.isArray(project.contracts)
      ? project.contracts.filter(contract => 
          contract.address && 
          contract.chain &&
          /^0x[a-fA-F0-9]{40}$/.test(contract.address)
        )
      : [],
    contractAddresses: project.contractAddresses && typeof project.contractAddresses === 'object'
      ? Object.fromEntries(
          Object.entries(project.contractAddresses).filter(([chain, address]) =>
            typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address)
          )
        )
      : {},
    repositories: Array.isArray(project.repositories)
      ? project.repositories.filter(repo => repo.owner && repo.repo)
      : [],
    traction: project.traction && typeof project.traction === 'object'
      ? {
          tvl: typeof project.traction.tvl === 'number' ? project.traction.tvl : 0,
          users: typeof project.traction.users === 'number' ? project.traction.users : 0,
          volume24h: typeof project.traction.volume24h === 'number' ? project.traction.volume24h : 0,
          holders: typeof project.traction.holders === 'number' ? project.traction.holders : 0,
          lastUpdated: project.traction.lastUpdated || new Date().toISOString(),
          source: project.traction.source || 'dune',
        }
      : {},
    github: project.github && typeof project.github === 'object'
      ? {
          owner: String(project.github.owner || '').trim(),
          repo: String(project.github.repo || '').trim(),
          commitsWeek: typeof project.github.commitsWeek === 'number' ? project.github.commitsWeek : 0,
          prsMerged: typeof project.github.prsMerged === 'number' ? project.github.prsMerged : 0,
          testCoverage: typeof project.github.testCoverage === 'number' ? project.github.testCoverage : 0,
          lastUpdated: project.github.lastUpdated || new Date().toISOString(),
          source: project.github.source || 'github',
        }
      : {},
    season: project.season || 'Unknown',
    isPublic: Boolean(project.isPublic !== false), // Default to true
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return sanitized;
};

// Validate environment variables
export const validateEnvironment = () => {
  const errors = [];
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY'
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};
