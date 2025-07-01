import React, { useState } from 'react';
import { Modal, Button, Card, CardContent } from '@/components/common';
import { 
  DocumentTextIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

// Terms sections configuration
const TERMS_SECTIONS = [
  {
    id: 'overview',
    title: 'Funding Overview',
    icon: BanknotesIcon,
    content: {
      type: 'overview',
      data: {}
    }
  },
  {
    id: 'eligibility',
    title: 'Eligibility Requirements',
    icon: ShieldCheckIcon,
    content: {
      type: 'list',
      items: [
        'Minimum credit score of 400',
        'Active GitHub account with development history',
        'Verified identity across connected platforms',
        'Clear project proposal and timeline',
        'Commitment to milestone-based development'
      ]
    }
  },
  {
    id: 'funding-terms',
    title: 'Funding Terms',
    icon: DocumentTextIcon,
    content: {
      type: 'terms',
      data: {
        interestRate: '0% APR',
        processingFee: '$0',
        repaymentRequired: 'Only if milestones not met',
        fundingPeriod: '6-12 months',
        maxAmount: 'Based on credit tier'
      }
    }
  },
  {
    id: 'milestones',
    title: 'Milestone Requirements',
    icon: CalendarIcon,
    content: {
      type: 'milestones',
      data: {
        frequency: 'Monthly progress reports required',
        criteria: 'Meaningful development progress',
        flexibility: 'Extensions available with justification',
        support: 'Technical mentorship provided'
      }
    }
  },
  {
    id: 'repayment',
    title: 'Repayment Conditions',
    icon: ExclamationTriangleIcon,
    content: {
      type: 'repayment',
      data: {
        successCriteria: 'Complete project milestones within timeframe',
        partialRepayment: '50% if significant progress shown',
        fullRepayment: 'Only if no meaningful progress',
        gracePeriod: '30 days after due date',
        supportProgram: 'Assistance available for struggling projects'
      }
    }
  },
  {
    id: 'legal',
    title: 'Legal Terms',
    icon: ScaleIcon,
    content: {
      type: 'legal',
      items: [
        'Funding agreement governed by Delaware law',
        'Disputes resolved through binding arbitration',
        'Intellectual property remains with developer',
        'Open source contribution encouraged but not required',
        'Privacy and data protection compliance required'
      ]
    }
  }
];

// Individual terms section component
const TermsSection = ({ section, fundingAmount, creditTier, isExpanded, onToggle }) => {
  const IconComponent = section.icon;

  const renderContent = () => {
    switch (section.content.type) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-700">${fundingAmount?.toLocaleString() || '0'}</div>
                <div className="text-sm text-primary-600">Funding Amount</div>
              </div>
              <div className="p-4 bg-success-50 rounded-lg">
                <div className="text-2xl font-bold text-success-700">0%</div>
                <div className="text-sm text-success-600">Interest Rate</div>
              </div>
              <div className="p-4 bg-warning-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-700">{creditTier || 'N/A'}</div>
                <div className="text-sm text-warning-600">Credit Tier</div>
              </div>
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="text-2xl font-bold text-secondary-700">6-12</div>
                <div className="text-sm text-secondary-600">Months</div>
              </div>
            </div>
            <div className="bg-background-secondary rounded-lg p-4">
              <p className="text-secondary text-sm">
                This funding is designed to support developer projects with milestone-based progression. 
                Successful completion of milestones results in grant conversion with no repayment required.
              </p>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-3">
            {Object.entries(section.content.data).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-border-secondary last:border-b-0">
                <span className="text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="font-medium text-primary">{value}</span>
              </div>
            ))}
          </div>
        );

      case 'milestones':
        return (
          <div className="space-y-3">
            {Object.entries(section.content.data).map(([key, value]) => (
              <div key={key} className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-success-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-primary capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-sm text-secondary">{value}</div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'repayment':
        return (
          <div className="space-y-4">
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-success-800 mb-1">Success Scenario (Most Common)</h5>
                  <p className="text-success-700 text-sm">{section.content.data.successCriteria}</p>
                  <p className="text-success-600 text-xs mt-1 font-medium">Result: No repayment required</p>
                </div>
              </div>
            </div>
            
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-warning-800 mb-1">Partial Progress</h5>
                  <p className="text-warning-700 text-sm">{section.content.data.partialRepayment}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-error-800 mb-1">No Progress</h5>
                  <p className="text-error-700 text-sm">{section.content.data.fullRepayment}</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-primary-800 mb-1">Support Available</h5>
                  <p className="text-primary-700 text-sm">{section.content.data.supportProgram}</p>
                  <p className="text-primary-600 text-xs mt-1">Grace period: {section.content.data.gracePeriod}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {section.content.items.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircleIcon className="h-4 w-4 text-success-500 mt-1 flex-shrink-0" />
                <span className="text-secondary text-sm">{item}</span>
              </div>
            ))}
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-2">
            {section.content.items.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-text-tertiary mt-2 flex-shrink-0" />
                <span className="text-secondary text-sm">{item}</span>
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-secondary">Content not available</div>;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-0">
        <button
          onClick={() => onToggle(section.id)}
          className="w-full p-6 text-left hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IconComponent className="h-5 w-5 text-primary-500" />
              <h3 className="font-medium text-primary">{section.title}</h3>
            </div>
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6">
            <div className="border-t border-border-secondary pt-4">
              {renderContent()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main funding terms modal component
export const FundingTermsModal = ({
  isOpen = false,
  onClose,
  onAccept,
  fundingAmount = 0,
  creditTier = '',
  projectTitle = '',
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['overview']));
  const [hasReadAllSections, setHasReadAllSections] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSectionToggle = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      
      // Check if user has expanded all sections
      if (newSet.size === TERMS_SECTIONS.length) {
        setHasReadAllSections(true);
      }
      
      return newSet;
    });
  };

  const handleExpandAll = () => {
    setExpandedSections(new Set(TERMS_SECTIONS.map(s => s.id)));
    setHasReadAllSections(true);
  };

  const handleCollapseAll = () => {
    setExpandedSections(new Set());
  };

  const handleAccept = () => {
    if (agreedToTerms && hasReadAllSections) {
      onAccept?.();
      onClose?.();
    }
  };

  const canAccept = agreedToTerms && hasReadAllSections;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Funding Terms & Conditions"
      description={projectTitle ? `Terms for ${projectTitle} funding` : 'Please review all terms before proceeding'}
      className={className}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-secondary">
            {expandedSections.size} of {TERMS_SECTIONS.length} sections expanded
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleExpandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCollapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="max-h-96 overflow-y-auto">
          {TERMS_SECTIONS.map((section) => (
            <TermsSection
              key={section.id}
              section={section}
              fundingAmount={fundingAmount}
              creditTier={creditTier}
              isExpanded={expandedSections.has(section.id)}
              onToggle={handleSectionToggle}
            />
          ))}
        </div>

        {/* Reading Progress */}
        <div className="bg-surface-secondary rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">Reading Progress</span>
            <span className="text-sm text-secondary">
              {Math.round((expandedSections.size / TERMS_SECTIONS.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-background-secondary rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(expandedSections.size / TERMS_SECTIONS.length) * 100}%` }}
            />
          </div>
          {!hasReadAllSections && (
            <p className="text-xs text-secondary mt-2">
              Please expand and review all sections to continue
            </p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="border-t border-border-secondary pt-6">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={!hasReadAllSections}
              className="mt-1 h-4 w-4 text-primary-500 border-border-secondary rounded focus:ring-primary-500 disabled:opacity-50"
            />
            <div className="text-sm">
              <span className="text-secondary">
                I have read and understood all terms and conditions. I agree to the funding terms 
                and commit to meeting the project milestones as outlined above.
              </span>
              {!hasReadAllSections && (
                <p className="text-xs text-warning-600 mt-1">
                  Please review all sections before agreeing to terms
                </p>
              )}
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-border-secondary">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={!canAccept}
            className={!canAccept ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Accept Terms & Continue
          </Button>
        </div>

        {/* Footer Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-primary-800 mb-1">Important Notice</h5>
              <p className="text-primary-700 text-sm">
                These terms are designed to support developer success. We provide mentorship, 
                technical support, and flexible milestone adjustments to help ensure your project's success. 
                Our goal is to see you succeed, not to collect repayments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FundingTermsModal;
