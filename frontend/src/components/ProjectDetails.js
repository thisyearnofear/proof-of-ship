/**
 * Project Details Component
 * Displays details of a funded project including milestones and progress
 */

import React, { useState, useEffect } from 'react';
import { useBuilderCredit } from '../contexts/BuilderCreditContext';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { Card } from './common/Card';
import Button from './common/Button';
import { LoadingSpinner } from './common/LoadingStates';
import {
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export default function ProjectDetails({ projectId, onMilestoneComplete }) {
  const { account } = useMetaMask();
  const {
    coreContract,
    projectDetails,
    loading: contractLoading,
    creditProfile
  } = useBuilderCredit();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load project details
  useEffect(() => {
    if (projectId && projectDetails && projectDetails[projectId]) {
      setProject(projectDetails[projectId]);
    } else if (projectId && coreContract) {
      loadProjectDetails();
    }
  }, [projectId, projectDetails, coreContract]);

  const loadProjectDetails = async () => {
    if (!coreContract || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Get project details from the contract
      const projectData = await coreContract.projects(projectId);
      
      // Format project data
      const formattedProject = {
        developer: projectData.developer,
        githubUrl: projectData.githubUrl,
        name: projectData.name,
        fundingAmount: ethers.utils.formatUnits(projectData.fundingAmount, 6),
        fundedAt: projectData.fundedAt.toNumber(),
        isActive: projectData.isActive,
        milestones: []
      };

      // Load milestones
      const MAX_MILESTONES = 20;
      let totalMilestoneRewards = 0;
      
      for (let i = 0; i < MAX_MILESTONES; i++) {
        try {
          const milestone = await coreContract.getMilestoneDetails(projectId, i);
          
          if (!milestone || !milestone.description) {
            break;
          }
          
          const milestoneReward = parseFloat(ethers.utils.formatUnits(milestone.reward, 6));
          totalMilestoneRewards += milestoneReward;
          
          formattedProject.milestones.push({
            description: milestone.description,
            reward: milestoneReward,
            confirmations: milestone.confirmations.toNumber(),
            completed: milestone.completed,
            completedAt: milestone.completedAt.toNumber()
          });
        } catch (err) {
          // End of milestones
          break;
        }
      }
      
      // Set completed percentage
      const completedMilestones = formattedProject.milestones.filter(m => m.completed).length;
      formattedProject.completedPercentage = 
        formattedProject.milestones.length > 0 
          ? Math.round((completedMilestones / formattedProject.milestones.length) * 100) 
          : 0;
          
      // Calculate earned amount
      formattedProject.earnedAmount = formattedProject.milestones
        .filter(m => m.completed)
        .reduce((sum, milestone) => sum + milestone.reward, 0);
      
      setProject(formattedProject);

    } catch (err) {
      console.error("Failed to load project details:", err);
      setError("Failed to load project details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMilestone = async (milestoneIndex) => {
    if (!coreContract || !account) {
      setError("Wallet not connected");
      return;
    }

    if (!projectId) {
      setError("Project ID not provided");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Call the completeMilestone function on the contract
      const tx = await coreContract.completeMilestone(projectId, milestoneIndex);
      const receipt = await tx.wait();

      // Find MilestoneCompleted event
      const milestoneEvent = receipt.events.find(e => e.event === "MilestoneCompleted");
      
      setSuccess({
        milestoneIndex,
        transactionHash: receipt.transactionHash,
        reward: ethers.utils.formatUnits(milestoneEvent.args.reward, 6)
      });

      // Reload project details
      await loadProjectDetails();

      // Notify parent component
      if (onMilestoneComplete) {
        onMilestoneComplete({
          projectId,
          milestoneIndex,
          reward: ethers.utils.formatUnits(milestoneEvent.args.reward, 6)
        });
      }

    } catch (err) {
      console.error("Failed to complete milestone:", err);
      setError("Failed to complete milestone: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading || contractLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="text-red-800">{error}</div>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="p-6">
        <div className="text-gray-500">No project found with ID: {projectId}</div>
      </Card>
    );
  }

  const isProjectOwner = account && project.developer && 
                         account.toLowerCase() === project.developer.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <div className="flex items-center mt-2 text-gray-600">
              <CalendarIcon className="w-5 h-5 mr-1" />
              <span>Funded on {formatDate(project.fundedAt)}</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {project.isActive ? 'Active' : 'Completed'}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 mb-1">Total Funding</div>
            <div className="text-2xl font-bold text-blue-900">${parseFloat(project.fundingAmount).toFixed(2)} USDC</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700 mb-1">Earned So Far</div>
            <div className="text-2xl font-bold text-green-900">${parseFloat(project.earnedAmount).toFixed(2)} USDC</div>
          </div>
        </div>

        <div className="flex items-center mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${project.completedPercentage}%` }}
            ></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {project.completedPercentage}% Complete
          </span>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <a 
            href={project.githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <GlobeAltIcon className="w-5 h-5 mr-1" />
            <span>View on GitHub</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
          </a>
          
          <div className="flex items-center text-gray-600">
            <DocumentTextIcon className="w-5 h-5 mr-1" />
            <span>{project.milestones.length} Milestones</span>
          </div>
        </div>
      </Card>

      {/* Success Message */}
      {success && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">
                Milestone Completed Successfully!
              </h4>
              <p className="text-green-800 mb-3">
                You have earned ${parseFloat(success.reward).toFixed(2)} USDC for this milestone.
              </p>
              
              {success.transactionHash && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="font-medium text-green-900">Transaction Hash:</div>
                    <div className="font-mono text-xs text-green-700 break-all">
                      {success.transactionHash}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Milestones */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
        
        <div className="space-y-4">
          {project.milestones.map((milestone, index) => (
            <Card key={index} className={`p-4 ${
              milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    milestone.completed ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {milestone.completed ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Milestone {index + 1}
                    </div>
                    <div className="text-gray-700 mt-1">
                      {milestone.description}
                    </div>
                    
                    {milestone.completed && (
                      <div className="text-sm text-green-600 mt-2">
                        Completed on {formatDate(milestone.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-gray-900 font-medium">
                    <BanknotesIcon className="w-5 h-5 mr-1 text-gray-600" />
                    ${parseFloat(milestone.reward).toFixed(2)} USDC
                  </div>
                  
                  {!milestone.completed && isProjectOwner && (
                    <Button
                      onClick={() => handleCompleteMilestone(index)}
                      disabled={loading}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="xs" className="mr-1" />
                          Processing...
                        </>
                      ) : (
                        'Mark Complete'
                      )}
                    </Button>
                  )}
                  
                  {milestone.completed && (
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      <span>Verified: {milestone.confirmations}/3</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}