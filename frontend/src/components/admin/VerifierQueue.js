import React from 'react';
import { ethers } from 'ethers';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { 
  CheckBadgeIcon, 
  ClockIcon, 
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

export default function VerifierQueue({ milestones, onApprove, loadingMilestoneId }) {
  if (milestones.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckBadgeIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Queue Clear!</h3>
        <p className="text-gray-500">No pending milestones for your assigned hackathons.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <Card key={`${milestone.projectId}-${milestone.milestoneId}`} className="overflow-hidden border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{milestone.projectName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Milestone {milestone.milestoneId + 1}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Pending Approval
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {parseFloat(ethers.utils.formatUnits(milestone.amount, 6)).toFixed(2)} USDC
                </div>
                <div className="text-xs text-gray-500">Milestone Reward</div>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              {milestone.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {milestone.assignedHackathons.map(h => (
                <span key={h.id} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {h.name}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                   {[...Array(milestone.approvalCount)].map((_, i) => (
                     <div key={i} className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                       <CheckBadgeIcon className="w-3 h-3 text-white" />
                     </div>
                   ))}
                   {[...Array(Math.max(0, milestone.assignedHackathons[0]?.requiredSignatures - milestone.approvalCount || 0))].map((_, i) => (
                     <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                   ))}
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {milestone.approvalCount} / {milestone.assignedHackathons[0]?.requiredSignatures || 3} Approvals
                </span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  href={milestone.githubUrl}
                  target="_blank"
                  icon={<CodeBracketIcon className="w-4 h-4" />}
                >
                  View Repo
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  disabled={milestone.hasApproved || loadingMilestoneId === `${milestone.projectId}-${milestone.milestoneId}`}
                  onClick={() => onApprove(milestone.onChainProjectId, milestone.milestoneId)}
                >
                  {milestone.hasApproved ? 'Already Approved' : 'Quick Approve'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
