import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CreditCardIcon,
  RocketLaunchIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Funding status flow configuration
const FUNDING_STATUSES = {
  draft: {
    id: 'draft',
    label: 'Draft',
    description: 'Application being prepared',
    icon: DocumentTextIcon,
    color: 'text-text-tertiary',
    bgColor: 'bg-background-secondary',
    borderColor: 'border-border-secondary'
  },
  submitted: {
    id: 'submitted',
    label: 'Submitted',
    description: 'Application submitted for review',
    icon: ClockIcon,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    borderColor: 'border-warning-300'
  },
  under_review: {
    id: 'under_review',
    label: 'Under Review',
    description: 'Credit assessment in progress',
    icon: ArrowPathIcon,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    borderColor: 'border-primary-300'
  },
  approved: {
    id: 'approved',
    label: 'Approved',
    description: 'Funding approved, awaiting disbursement',
    icon: CheckCircleIcon,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-300'
  },
  disbursed: {
    id: 'disbursed',
    label: 'Disbursed',
    description: 'Funds sent to your wallet',
    icon: BanknotesIcon,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-300'
  },
  active: {
    id: 'active',
    label: 'Active',
    description: 'Project in development',
    icon: RocketLaunchIcon,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    borderColor: 'border-primary-300'
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    description: 'Project successfully completed',
    icon: CheckCircleIcon,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-300'
  },
  rejected: {
    id: 'rejected',
    label: 'Rejected',
    description: 'Application not approved',
    icon: XCircleIcon,
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    borderColor: 'border-error-300'
  },
  overdue: {
    id: 'overdue',
    label: 'Overdue',
    description: 'Milestones missed, action required',
    icon: ExclamationTriangleIcon,
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    borderColor: 'border-error-300'
  }
};

// Status flow paths
const STATUS_FLOWS = {
  normal: ['draft', 'submitted', 'under_review', 'approved', 'disbursed', 'active', 'completed'],
  rejected: ['draft', 'submitted', 'under_review', 'rejected'],
  overdue: ['draft', 'submitted', 'under_review', 'approved', 'disbursed', 'active', 'overdue']
};

// Mock funding application data
const generateMockFundingApplication = (status = 'active') => ({
  id: 'app-001',
  status: status,
  amount: 2500,
  currency: 'USDC',
  projectTitle: 'DeFi Portfolio Tracker',
  submittedAt: '2024-06-15T10:30:00Z',
  reviewStartedAt: '2024-06-15T11:00:00Z',
  approvedAt: '2024-06-15T14:20:00Z',
  disbursedAt: '2024-06-15T15:45:00Z',
  dueDate: '2024-12-15T23:59:59Z',
  estimatedReviewTime: '2-4 hours',
  estimatedDisbursementTime: '1-2 hours',
  transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
  network: 'ethereum',
  walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
  creditScore: 720,
  milestones: [
    { id: 1, title: 'MVP Development', status: 'completed', progress: 100 },
    { id: 2, title: 'Beta Testing', status: 'in-progress', progress: 60 },
    { id: 3, title: 'Production Launch', status: 'pending', progress: 0 }
  ],
  nextActions: [
    'Complete beta testing phase',
    'Submit progress report',
    'Prepare for production launch'
  ]
});

// Status timeline component
const StatusTimeline = ({ currentStatus, timestamps = {} }) => {
  const getStatusFlow = (status) => {
    if (status === 'rejected') return STATUS_FLOWS.rejected;
    if (status === 'overdue') return STATUS_FLOWS.overdue;
    return STATUS_FLOWS.normal;
  };

  const statusFlow = getStatusFlow(currentStatus);
  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {statusFlow.map((statusId, index) => {
          const status = FUNDING_STATUSES[statusId];
          const isActive = statusId === currentStatus;
          const isCompleted = index < currentIndex;
          const isPending = index > currentIndex;
          const StatusIcon = status.icon;

          return (
            <div key={statusId} className="flex flex-col items-center relative">
              {/* Status Circle */}
              <div
                className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${isActive 
                    ? `${status.borderColor} ${status.bgColor} shadow-lg scale-110` 
                    : isCompleted 
                      ? 'border-success-300 bg-success-100' 
                      : 'border-border-secondary bg-surface'
                  }
                `}
              >
                <StatusIcon 
                  className={`h-5 w-5 ${
                    isActive ? status.color : 
                    isCompleted ? 'text-success-600' : 
                    'text-text-tertiary'
                  }`} 
                />
                
                {isActive && (
                  <div className="absolute -inset-1 rounded-full border-2 border-primary-300 animate-ping opacity-75" />
                )}
              </div>

              {/* Status Label */}
              <div className="mt-2 text-center">
                <div className={`text-xs font-medium ${isActive ? status.color : 'text-text-secondary'}`}>
                  {status.label}
                </div>
                {timestamps[statusId] && (
                  <div className="text-xs text-tertiary mt-1">
                    {new Date(timestamps[statusId]).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Connection Line */}
              {index < statusFlow.length - 1 && (
                <div 
                  className={`
                    absolute top-6 left-12 w-16 h-0.5 transition-colors duration-300
                    ${isCompleted ? 'bg-success-300' : 'bg-border-secondary'}
                  `}
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Progress indicator component
const ProgressIndicator = ({ milestones }) => {
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-primary">Project Progress</h4>
        <span className="text-sm font-medium text-primary">
          {completedMilestones} / {totalMilestones} milestones
        </span>
      </div>
      
      <div className="w-full bg-background-secondary rounded-full h-3">
        <div
          className="bg-gradient-to-r from-primary-500 to-success-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>
      
      <div className="space-y-2">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                milestone.status === 'completed' ? 'bg-success-500' :
                milestone.status === 'in-progress' ? 'bg-primary-500' :
                'bg-background-secondary'
              }`} />
              <span className="text-secondary">{milestone.title}</span>
            </div>
            <span className={`font-medium ${
              milestone.status === 'completed' ? 'text-success-600' :
              milestone.status === 'in-progress' ? 'text-primary-600' :
              'text-text-tertiary'
            }`}>
              {milestone.progress}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Next actions component
const NextActions = ({ actions, status }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-primary">Next Actions</h4>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-surface-secondary rounded-lg">
            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
            <span className="text-sm text-secondary">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main funding status tracker component
export const FundingStatusTracker = ({ 
  applicationId = null,
  applicationData = null,
  onRefresh,
  className = '' 
}) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Use mock data if no real data provided
  useEffect(() => {
    if (applicationData) {
      setApplication(applicationData);
    } else {
      setApplication(generateMockFundingApplication());
    }
  }, [applicationData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch fresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  if (!application) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const currentStatusInfo = FUNDING_STATUSES[application.status];
  const timestamps = {
    submitted: application.submittedAt,
    under_review: application.reviewStartedAt,
    approved: application.approvedAt,
    disbursed: application.disbursedAt
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <currentStatusInfo.icon className={`h-5 w-5 mr-2 ${currentStatusInfo.color}`} />
              {application.projectTitle}
            </CardTitle>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusInfo.bgColor} ${currentStatusInfo.color}`}>
                {currentStatusInfo.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Description */}
            <div className="lg:col-span-2">
              <p className="text-secondary mb-4">{currentStatusInfo.description}</p>
              
              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-secondary">Amount:</span>
                  <span className="ml-2 font-medium text-primary">
                    ${application.amount.toLocaleString()} {application.currency}
                  </span>
                </div>
                <div>
                  <span className="text-secondary">Credit Score:</span>
                  <span className="ml-2 font-medium text-primary">{application.creditScore}</span>
                </div>
                <div>
                  <span className="text-secondary">Submitted:</span>
                  <span className="ml-2 font-medium text-primary">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-secondary">Due Date:</span>
                  <span className="ml-2 font-medium text-primary">
                    {new Date(application.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              {application.status === 'disbursed' && application.transactionHash && (
                <Button variant="outline" size="sm" fullWidth>
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  View Transaction
                </Button>
              )}
              
              {application.status === 'active' && (
                <Button variant="primary" size="sm" fullWidth>
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Submit Progress
                </Button>
              )}
              
              {(application.status === 'overdue' || application.status === 'rejected') && (
                <Button variant="warning" size="sm" fullWidth>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Take Action
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStatus={application.status} timestamps={timestamps} />
          
          <div className="mt-6 text-center text-xs text-secondary">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Progress and Actions */}
      {application.status === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressIndicator milestones={application.milestones} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <NextActions actions={application.nextActions} status={application.status} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estimated Times */}
      {(application.status === 'submitted' || application.status === 'under_review') && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">
                {application.status === 'submitted' ? 'Estimated Review Time:' : 'Estimated Approval Time:'}
              </span>
              <span className="font-medium text-primary">
                {application.status === 'submitted' ? application.estimatedReviewTime : application.estimatedDisbursementTime}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FundingStatusTracker;
