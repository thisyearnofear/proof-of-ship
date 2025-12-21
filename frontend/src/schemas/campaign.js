/**
 * Testing Campaign validation schemas
 * Used for campaign creation, discovery, submissions, and approvals
 */

// Campaign validation schema
export const validateCampaign = (campaign) => {
  const errors = [];

  // Project ID required (ID and creatorId will be set at Firestore write time)
  if (!campaign.projectId || typeof campaign.projectId !== 'string') {
    errors.push('Project ID is required and must be a string');
  }

  if (!campaign.title || typeof campaign.title !== 'string' || campaign.title.length < 5) {
    errors.push('Campaign title is required and must be at least 5 characters');
  }

  if (campaign.title && campaign.title.length > 100) {
    errors.push('Campaign title must be 100 characters or less');
  }

  if (!campaign.description || typeof campaign.description !== 'string' || campaign.description.length < 20) {
    errors.push('Campaign description is required and must be at least 20 characters');
  }

  if (campaign.description && campaign.description.length > 2000) {
    errors.push('Campaign description must be 2000 characters or less');
  }

  // Status validation
  const validStatuses = ['draft', 'open', 'closed', 'review', 'approved', 'rejected'];
  if (!campaign.status || !validStatuses.includes(campaign.status)) {
    errors.push(`Campaign status must be one of: ${validStatuses.join(', ')}`);
  }

  // Deadline validation
  if (!campaign.deadline || isNaN(new Date(campaign.deadline).getTime())) {
    errors.push('Campaign deadline is required and must be a valid date');
  }

  if (campaign.deadline && new Date(campaign.deadline) < new Date()) {
    errors.push('Campaign deadline cannot be in the past');
  }

  // Budget validation
  if (typeof campaign.budget !== 'object' || !campaign.budget) {
    errors.push('Campaign must have budget information');
  } else {
    if (typeof campaign.budget.total !== 'number' || campaign.budget.total <= 0) {
      errors.push('Campaign budget.total must be a positive number');
    }

    if (typeof campaign.budget.perSubmission !== 'number' || campaign.budget.perSubmission <= 0) {
      errors.push('Campaign budget.perSubmission must be a positive number');
    }

    if (campaign.budget.perSubmission > campaign.budget.total) {
      errors.push('budget.perSubmission cannot exceed budget.total');
    }
  }

  // Requirements validation
  if (!Array.isArray(campaign.requirements) || campaign.requirements.length === 0) {
    errors.push('Campaign must have at least one requirement');
  } else {
    campaign.requirements.forEach((req, index) => {
      if (!req.title || typeof req.title !== 'string') {
        errors.push(`Requirement ${index} must have a title`);
      }
      if (!req.description || typeof req.description !== 'string') {
        errors.push(`Requirement ${index} must have a description`);
      }
    });
  }

  // Test scenarios validation
  if (!Array.isArray(campaign.testScenarios) || campaign.testScenarios.length === 0) {
    errors.push('Campaign must have at least one test scenario');
  } else {
    campaign.testScenarios.forEach((scenario, index) => {
      if (!scenario.title || typeof scenario.title !== 'string') {
        errors.push(`Test scenario ${index} must have a title`);
      }
      if (!scenario.steps || !Array.isArray(scenario.steps) || scenario.steps.length === 0) {
        errors.push(`Test scenario ${index} must have at least one step`);
      }
    });
  }

  // Expected outcome validation
  if (!campaign.expectedOutcome || typeof campaign.expectedOutcome !== 'string' || campaign.expectedOutcome.length < 10) {
    errors.push('Campaign expectedOutcome is required and must be at least 10 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Campaign submission validation
export const validateCampaignSubmission = (submission) => {
  const errors = [];

  // campaignId and testerId will be set at Firestore write time
  if (!submission.campaignId || typeof submission.campaignId !== 'string') {
    errors.push('Campaign ID is required');
  }

  if (!submission.testerId || typeof submission.testerId !== 'string') {
    errors.push('Tester ID is required');
  }

  if (!submission.results || typeof submission.results !== 'object') {
    errors.push('Submission must have results');
  } else {
    // Each result should map to a test scenario
    if (!submission.results.scenarioResults || !Array.isArray(submission.results.scenarioResults)) {
      errors.push('results.scenarioResults must be an array');
    } else {
      submission.results.scenarioResults.forEach((result, index) => {
        if (!result.scenarioId || typeof result.scenarioId !== 'string') {
          errors.push(`Scenario result ${index} must have a scenarioId`);
        }
        if (!result.passed === undefined && typeof result.passed !== 'boolean') {
          errors.push(`Scenario result ${index} must indicate if it passed`);
        }
        if (result.notes && typeof result.notes !== 'string') {
          errors.push(`Scenario result ${index} notes must be a string`);
        }
      });
    }

    if (typeof submission.results.overallRating !== 'number' || submission.results.overallRating < 1 || submission.results.overallRating > 5) {
      errors.push('results.overallRating must be between 1 and 5');
    }

    if (!submission.results.feedback || typeof submission.results.feedback !== 'string') {
      errors.push('results.feedback is required');
    }

    if (submission.results.evidence && !Array.isArray(submission.results.evidence)) {
      errors.push('results.evidence must be an array');
    }
  }

  if (!submission.status || !['draft', 'submitted', 'approved', 'rejected'].includes(submission.status)) {
    errors.push('Submission status is required and must be valid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize campaign data
export const sanitizeCampaign = (campaign) => {
  const validStatuses = ['draft', 'open', 'closed', 'review', 'approved', 'rejected'];

  const sanitized = {
    projectId: String(campaign.projectId || '').trim(),
    title: String(campaign.title || '').trim().substring(0, 100),
    description: String(campaign.description || '').trim().substring(0, 2000),
    status: validStatuses.includes(campaign.status) ? campaign.status : 'draft',
    deadline: campaign.deadline ? new Date(campaign.deadline).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    budget: campaign.budget && typeof campaign.budget === 'object'
      ? {
          total: typeof campaign.budget.total === 'number' ? Math.max(0, campaign.budget.total) : 0,
          perSubmission: typeof campaign.budget.perSubmission === 'number' ? Math.max(0, campaign.budget.perSubmission) : 0,
          currency: String(campaign.budget.currency || 'USDC').trim(),
          tokenAllocation: typeof campaign.budget.tokenAllocation === 'number' ? Math.max(0, campaign.budget.tokenAllocation) : 0,
        }
      : { total: 0, perSubmission: 0, currency: 'USDC', tokenAllocation: 0 },
    requirements: Array.isArray(campaign.requirements)
      ? campaign.requirements.filter(req => req.title && req.description).map(req => ({
          title: String(req.title).substring(0, 200),
          description: String(req.description).substring(0, 1000),
          priority: req.priority || 'medium', // low, medium, high
        }))
      : [],
    testScenarios: Array.isArray(campaign.testScenarios)
      ? campaign.testScenarios.filter(scenario => scenario.title && scenario.steps).map(scenario => ({
          id: scenario.id || `scenario-${Date.now()}`,
          title: String(scenario.title).substring(0, 200),
          description: String(scenario.description || '').substring(0, 1000),
          steps: Array.isArray(scenario.steps)
            ? scenario.steps.map(step => String(step).substring(0, 500))
            : [],
          expectedResult: String(scenario.expectedResult || '').substring(0, 500),
        }))
      : [],
    expectedOutcome: String(campaign.expectedOutcome || '').trim().substring(0, 1000),
    successMetrics: Array.isArray(campaign.successMetrics)
      ? campaign.successMetrics.map(metric => ({
          name: String(metric.name || '').substring(0, 100),
          target: String(metric.target || '').substring(0, 200),
        }))
      : [],
    maxSubmissions: typeof campaign.maxSubmissions === 'number' ? Math.max(1, campaign.maxSubmissions) : 50,
    eligibility: campaign.eligibility && typeof campaign.eligibility === 'object'
      ? {
          minLevel: campaign.eligibility.minLevel || 'beginner',
          requiredExperience: String(campaign.eligibility.requiredExperience || '').substring(0, 500),
          geographicRestrictions: Array.isArray(campaign.eligibility.geographicRestrictions)
            ? campaign.eligibility.geographicRestrictions
            : [],
        }
      : { minLevel: 'beginner', requiredExperience: '', geographicRestrictions: [] },
    createdAt: campaign.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: campaign.stats && typeof campaign.stats === 'object'
      ? {
          totalSubmissions: typeof campaign.stats.totalSubmissions === 'number' ? campaign.stats.totalSubmissions : 0,
          approvedSubmissions: typeof campaign.stats.approvedSubmissions === 'number' ? campaign.stats.approvedSubmissions : 0,
          averageRating: typeof campaign.stats.averageRating === 'number' ? campaign.stats.averageRating : 0,
        }
      : { totalSubmissions: 0, approvedSubmissions: 0, averageRating: 0 },
  };

  return sanitized;
};

// Sanitize submission data
export const sanitizeSubmission = (submission) => {
  const sanitized = {
    campaignId: String(submission.campaignId || '').trim(),
    testerId: String(submission.testerId || '').trim(),
    results: submission.results && typeof submission.results === 'object'
      ? {
          scenarioResults: Array.isArray(submission.results.scenarioResults)
            ? submission.results.scenarioResults.map(result => ({
                scenarioId: String(result.scenarioId || ''),
                passed: Boolean(result.passed),
                notes: String(result.notes || '').substring(0, 1000),
              }))
            : [],
          overallRating: Math.min(5, Math.max(1, typeof submission.results.overallRating === 'number' ? submission.results.overallRating : 3)),
          feedback: String(submission.results.feedback || '').substring(0, 2000),
          evidence: Array.isArray(submission.results.evidence)
            ? submission.results.evidence.map(e => ({
                type: ['screenshot', 'video', 'log', 'other'].includes(e.type) ? e.type : 'other',
                url: String(e.url || ''),
                description: String(e.description || '').substring(0, 500),
              }))
            : [],
          bugsSeverity: Array.isArray(submission.results.bugsSeverity)
            ? submission.results.bugsSeverity.map(bug => ({
                severity: ['critical', 'high', 'medium', 'low'].includes(bug.severity) ? bug.severity : 'medium',
                description: String(bug.description || '').substring(0, 500),
              }))
            : [],
        }
      : { scenarioResults: [], overallRating: 3, feedback: '', evidence: [], bugsSeverity: [] },
    status: ['draft', 'submitted', 'approved', 'rejected'].includes(submission.status) ? submission.status : 'draft',
    submittedAt: submission.submittedAt || new Date().toISOString(),
    approvalNotes: String(submission.approvalNotes || '').substring(0, 1000),
    createdAt: submission.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return sanitized;
};
