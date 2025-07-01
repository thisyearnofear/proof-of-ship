import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/common';
import { 
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Mock funding history data
const generateMockFundingHistory = () => [
  {
    id: 'fund-001',
    amount: 2500,
    currency: 'USDC',
    status: 'completed',
    requestDate: '2024-06-15T10:30:00Z',
    approvalDate: '2024-06-15T14:20:00Z',
    disbursementDate: '2024-06-15T15:45:00Z',
    dueDate: '2024-12-15T23:59:59Z',
    projectTitle: 'DeFi Portfolio Tracker',
    projectDescription: 'A comprehensive DeFi portfolio tracking application with real-time analytics',
    milestones: [
      { id: 1, title: 'MVP Development', status: 'completed', dueDate: '2024-08-15', completedDate: '2024-08-10' },
      { id: 2, title: 'Beta Testing', status: 'completed', dueDate: '2024-10-15', completedDate: '2024-10-12' },
      { id: 3, title: 'Production Launch', status: 'in-progress', dueDate: '2024-12-15' }
    ],
    transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
    network: 'ethereum',
    creditScoreAtTime: 720,
    repaymentRequired: false
  },
  {
    id: 'fund-002',
    amount: 1000,
    currency: 'USDC',
    status: 'active',
    requestDate: '2024-05-01T09:15:00Z',
    approvalDate: '2024-05-01T11:30:00Z',
    disbursementDate: '2024-05-01T12:00:00Z',
    dueDate: '2024-11-01T23:59:59Z',
    projectTitle: 'NFT Marketplace Integration',
    projectDescription: 'Smart contract integration for NFT marketplace with advanced filtering',
    milestones: [
      { id: 1, title: 'Smart Contract Development', status: 'completed', dueDate: '2024-07-01', completedDate: '2024-06-28' },
      { id: 2, title: 'Frontend Integration', status: 'in-progress', dueDate: '2024-09-01' },
      { id: 3, title: 'Security Audit', status: 'pending', dueDate: '2024-11-01' }
    ],
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    network: 'polygon',
    creditScoreAtTime: 680,
    repaymentRequired: false
  },
  {
    id: 'fund-003',
    amount: 500,
    currency: 'USDC',
    status: 'overdue',
    requestDate: '2024-03-10T14:20:00Z',
    approvalDate: '2024-03-10T16:45:00Z',
    disbursementDate: '2024-03-10T17:30:00Z',
    dueDate: '2024-09-10T23:59:59Z',
    projectTitle: 'Social Media Analytics Tool',
    projectDescription: 'Analytics dashboard for social media engagement tracking',
    milestones: [
      { id: 1, title: 'Data Collection Setup', status: 'completed', dueDate: '2024-05-10', completedDate: '2024-05-08' },
      { id: 2, title: 'Dashboard Development', status: 'overdue', dueDate: '2024-07-10' },
      { id: 3, title: 'User Testing', status: 'pending', dueDate: '2024-09-10' }
    ],
    transactionHash: '0x567890abcdef1234567890abcdef1234567890ab',
    network: 'optimism',
    creditScoreAtTime: 650,
    repaymentRequired: true,
    repaymentAmount: 250
  }
];

// Status configuration
const statusConfig = {
  pending: {
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    icon: ClockIcon,
    label: 'Pending Approval'
  },
  approved: {
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    icon: CheckCircleIcon,
    label: 'Approved'
  },
  active: {
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    icon: CheckCircleIcon,
    label: 'Active'
  },
  completed: {
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    icon: CheckCircleIcon,
    label: 'Completed'
  },
  overdue: {
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    icon: ExclamationTriangleIcon,
    label: 'Overdue'
  },
  cancelled: {
    color: 'text-error-600',
    bgColor: 'bg-error-100',
    icon: XCircleIcon,
    label: 'Cancelled'
  }
};

// Milestone status component
const MilestoneStatus = ({ milestone }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-100';
      case 'in-progress': return 'text-primary-600 bg-primary-100';
      case 'overdue': return 'text-error-600 bg-error-100';
      default: return 'text-text-tertiary bg-background-secondary';
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(milestone.status).split(' ')[1]}`} />
        <span className="text-sm font-medium text-primary">{milestone.title}</span>
      </div>
      <div className="text-xs text-secondary">
        {milestone.status === 'completed' && milestone.completedDate && (
          <span className="text-success-600">
            Completed {new Date(milestone.completedDate).toLocaleDateString()}
          </span>
        )}
        {milestone.status !== 'completed' && (
          <span className={milestone.status === 'overdue' ? 'text-error-600' : ''}>
            Due {new Date(milestone.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

// Individual funding record component
const FundingRecord = ({ funding, expanded, onToggleExpand }) => {
  const statusInfo = statusConfig[funding.status];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-primary">{funding.projectTitle}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              
              <p className="text-secondary text-sm mb-3">{funding.projectDescription}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                <div className="flex items-center">
                  <BanknotesIcon className="h-4 w-4 mr-1" />
                  ${funding.amount.toLocaleString()} {funding.currency}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {new Date(funding.requestDate).toLocaleDateString()}
                </div>
                {funding.transactionHash && (
                  <button className="flex items-center text-primary-600 hover:text-primary-700">
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                    View Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpand(funding.id)}
          >
            {expanded ? 'Less' : 'More'}
          </Button>
        </div>

        {/* Progress bar for active/overdue projects */}
        {(funding.status === 'active' || funding.status === 'overdue') && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-secondary">Project Progress</span>
              <span className="font-medium text-primary">
                {funding.milestones.filter(m => m.status === 'completed').length} / {funding.milestones.length} milestones
              </span>
            </div>
            <div className="w-full bg-background-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  funding.status === 'overdue' ? 'bg-error-500' : 'bg-success-500'
                }`}
                style={{
                  width: `${(funding.milestones.filter(m => m.status === 'completed').length / funding.milestones.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t border-border-secondary">
            {/* Milestones */}
            <div>
              <h4 className="font-medium text-primary mb-3">Project Milestones</h4>
              <div className="space-y-1">
                {funding.milestones.map((milestone) => (
                  <MilestoneStatus key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="font-medium text-primary mb-3">Funding Timeline</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Request Submitted:</span>
                  <span className="text-primary">{new Date(funding.requestDate).toLocaleString()}</span>
                </div>
                {funding.approvalDate && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Approved:</span>
                    <span className="text-primary">{new Date(funding.approvalDate).toLocaleString()}</span>
                  </div>
                )}
                {funding.disbursementDate && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Funds Disbursed:</span>
                    <span className="text-primary">{new Date(funding.disbursementDate).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-secondary">Project Due Date:</span>
                  <span className={`${funding.status === 'overdue' ? 'text-error-600' : 'text-primary'}`}>
                    {new Date(funding.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Repayment info */}
            {funding.repaymentRequired && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-error-800 mb-1">Repayment Required</h5>
                    <p className="text-error-700 text-sm mb-2">
                      Due to missed milestones, partial repayment of ${funding.repaymentAmount} is required.
                    </p>
                    <Button size="sm" variant="danger">
                      Make Payment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction details */}
            {funding.transactionHash && (
              <div className="bg-surface-secondary rounded-lg p-4">
                <h5 className="font-medium text-primary mb-2">Transaction Details</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary">Network:</span>
                    <span className="text-primary capitalize">{funding.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Transaction Hash:</span>
                    <button className="text-primary-600 hover:text-primary-700 font-mono text-xs">
                      {funding.transactionHash.slice(0, 10)}...{funding.transactionHash.slice(-8)}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Credit Score at Time:</span>
                    <span className="text-primary">{funding.creditScoreAtTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main funding history component
export const FundingHistory = ({ 
  fundingData = null,
  className = '' 
}) => {
  const [expandedRecords, setExpandedRecords] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Use mock data if no real data provided
  const allFunding = fundingData || generateMockFundingHistory();

  // Filter and sort funding records
  const filteredFunding = allFunding
    .filter(funding => statusFilter === 'all' || funding.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.requestDate) - new Date(a.requestDate);
        case 'date-asc':
          return new Date(a.requestDate) - new Date(b.requestDate);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

  const handleToggleExpand = (fundingId) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fundingId)) {
        newSet.delete(fundingId);
      } else {
        newSet.add(fundingId);
      }
      return newSet;
    });
  };

  // Calculate summary statistics
  const totalFunded = allFunding.reduce((sum, funding) => sum + funding.amount, 0);
  const activeFunding = allFunding.filter(f => f.status === 'active').length;
  const completedFunding = allFunding.filter(f => f.status === 'completed').length;
  const overdueCount = allFunding.filter(f => f.status === 'overdue').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">${totalFunded.toLocaleString()}</div>
            <div className="text-sm text-secondary">Total Funded</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{activeFunding}</div>
            <div className="text-sm text-secondary">Active Projects</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success-600">{completedFunding}</div>
            <div className="text-sm text-secondary">Completed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-error-600">{overdueCount}</div>
            <div className="text-sm text-secondary">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Funding History
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-text-secondary" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-border-secondary rounded-md px-2 py-1 bg-surface"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-border-secondary rounded-md px-2 py-1 bg-surface"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredFunding.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No Funding Records</h3>
              <p className="text-secondary">
                {statusFilter === 'all' 
                  ? "You haven't received any funding yet." 
                  : `No funding records with status "${statusFilter}".`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFunding.map((funding) => (
                <FundingRecord
                  key={funding.id}
                  funding={funding}
                  expanded={expandedRecords.has(funding.id)}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FundingHistory;
