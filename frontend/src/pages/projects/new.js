import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/common/layout';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

const ECOSYSTEMS = {
  celo: {
    name: 'Celo',
    description: 'Mobile-first blockchain platform',
    color: '#35D07F',
    icon: '🌱',
    requirements: [
      'Project must be deployed on Celo network',
      'Include mobile-friendly features',
      'Focus on financial inclusion'
    ]
  },
  base: {
    name: 'Base',
    description: 'Coinbase\'s Ethereum L2 network',
    color: '#0052FF',
    icon: '🔵',
    requirements: [
      'Project must be deployed on Base network',
      'Leverage Base\'s low fees and fast transactions',
      'Consider integration with Coinbase ecosystem'
    ]
  }
};

const PROJECT_CATEGORIES = [
  { id: 'defi', name: 'DeFi', description: 'Decentralized Finance protocols and applications' },
  { id: 'nft', name: 'NFTs', description: 'Non-fungible tokens and digital collectibles' },
  { id: 'gaming', name: 'Gaming', description: 'Blockchain-based games and gaming infrastructure' },
  { id: 'social', name: 'Social', description: 'Social networks and community platforms' },
  { id: 'infrastructure', name: 'Infrastructure', description: 'Developer tools and blockchain infrastructure' },
  { id: 'dao', name: 'DAO', description: 'Decentralized Autonomous Organizations' },
  { id: 'other', name: 'Other', description: 'Other innovative blockchain applications' }
];

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubUrl: '',
    website: '',
    twitter: '',
    discord: '',
    ecosystem: 'base', // Default to Base for new submissions
    category: '',
    contractAddress: '',
    deploymentTxHash: '',
    teamMembers: [''],
    tags: [],
    isOpenSource: true,
    lookingForFunding: false,
    fundingAmount: '',
    milestones: ['']
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/projects/new');
    }
  }, [currentUser, authLoading, router]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleArrayInputChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.githubUrl.trim()) newErrors.githubUrl = 'GitHub URL is required';
      if (!formData.category) newErrors.category = 'Category is required';
      
      // Validate GitHub URL format
      if (formData.githubUrl && !formData.githubUrl.includes('github.com')) {
        newErrors.githubUrl = 'Please enter a valid GitHub URL';
      }
    }

    if (step === 2) {
      if (!formData.contractAddress.trim()) {
        newErrors.contractAddress = 'Contract address is required for verification';
      }
      
      // Basic contract address validation
      if (formData.contractAddress && !formData.contractAddress.startsWith('0x')) {
        newErrors.contractAddress = 'Contract address must start with 0x';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    try {
      // Clean up form data
      const cleanedData = {
        ...formData,
        teamMembers: formData.teamMembers.filter(member => member.trim()),
        milestones: formData.milestones.filter(milestone => milestone.trim()),
        submittedBy: currentUser.uid,
        submittedAt: new Date().toISOString(),
        status: 'pending_review'
      };

      // Submit to your API
      const response = await fetch('/api/projects/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData)
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Redirect after success
        setTimeout(() => {
          router.push('/shippers');
        }, 3000);
      } else {
        throw new Error('Failed to submit project');
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      setErrors({ submit: 'Failed to submit project. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
        
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Project Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your project has been submitted for review. We'll notify you once it's approved 
              and added to the {ECOSYSTEMS[formData.ecosystem].name} ecosystem dashboard.
            </p>
            <Button
              onClick={() => router.push('/shippers')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              View Projects
            </Button>
          </Card>
        </div>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Submit Your Project
          </h1>
          <p className="text-lg text-gray-600">
            Add your project to the multi-chain ecosystem dashboard
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-sm text-gray-600">
              Step {currentStep} of 3: {
                currentStep === 1 ? 'Project Details' :
                currentStep === 2 ? 'Technical Info' :
                'Review & Submit'
              }
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Project Details
              </h3>

              {/* Ecosystem Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Ecosystem
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(ECOSYSTEMS).map(([key, ecosystem]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleInputChange('ecosystem', key)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.ecosystem === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{ecosystem.icon}</span>
                        <span className="font-semibold">{ecosystem.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{ecosystem.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input
                  label="Project Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select a category</option>
                    {PROJECT_CATEGORIES.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={errors.description}
                  multiline
                  rows={4}
                  placeholder="Describe your project, its purpose, and key features..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input
                  label="GitHub Repository"
                  value={formData.githubUrl}
                  onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                  error={errors.githubUrl}
                  placeholder="https://github.com/username/repo"
                  required
                />
                
                <Input
                  label="Website (Optional)"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourproject.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Twitter (Optional)"
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourproject"
                />
                
                <Input
                  label="Discord (Optional)"
                  value={formData.discord}
                  onChange={(e) => handleInputChange('discord', e.target.value)}
                  placeholder="https://discord.gg/yourproject"
                />
              </div>
            </Card>
          )}

          {/* Step 2: Technical Information */}
          {currentStep === 2 && (
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Technical Information
              </h3>

              {/* Ecosystem Requirements */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">
                      {ECOSYSTEMS[formData.ecosystem].name} Requirements
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {ECOSYSTEMS[formData.ecosystem].requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span>•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input
                  label="Smart Contract Address"
                  value={formData.contractAddress}
                  onChange={(e) => handleInputChange('contractAddress', e.target.value)}
                  error={errors.contractAddress}
                  placeholder="0x..."
                  required
                />
                
                <Input
                  label="Deployment Transaction Hash (Optional)"
                  value={formData.deploymentTxHash}
                  onChange={(e) => handleInputChange('deploymentTxHash', e.target.value)}
                  placeholder="0x..."
                />
              </div>

              {/* Team Members */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Team Members
                </label>
                {formData.teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      value={member}
                      onChange={(e) => handleArrayInputChange('teamMembers', index, e.target.value)}
                      placeholder="Team member name or GitHub username"
                      className="flex-1"
                    />
                    {formData.teamMembers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeArrayItem('teamMembers', index)}
                        className="px-3 py-2"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem('teamMembers')}
                  className="mt-2"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>

              {/* Funding */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="lookingForFunding"
                    checked={formData.lookingForFunding}
                    onChange={(e) => handleInputChange('lookingForFunding', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="lookingForFunding" className="text-sm font-medium text-gray-700">
                    Looking for funding
                  </label>
                </div>
                
                {formData.lookingForFunding && (
                  <Input
                    label="Funding Amount Needed (USD)"
                    value={formData.fundingAmount}
                    onChange={(e) => handleInputChange('fundingAmount', e.target.value)}
                    placeholder="e.g., 50000"
                    type="number"
                  />
                )}
              </div>
            </Card>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === 3 && (
            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Review & Submit
              </h3>

              {/* Project Summary */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: ECOSYSTEMS[formData.ecosystem].color }}
                  >
                    {ECOSYSTEMS[formData.ecosystem].icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                    <p className="text-sm text-gray-600">
                      {ECOSYSTEMS[formData.ecosystem].name} • {
                        PROJECT_CATEGORIES.find(c => c.id === formData.category)?.name
                      }
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{formData.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">GitHub:</span>
                    <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline ml-2">
                      {formData.githubUrl}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium">Contract:</span>
                    <span className="ml-2 font-mono text-xs">{formData.contractAddress}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    required
                    className="mt-1 rounded border-gray-300"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                    I confirm that this project is deployed on the {ECOSYSTEMS[formData.ecosystem].name} network 
                    and all information provided is accurate. I understand that false information may result 
                    in project removal.
                  </label>
                </div>
              </div>

              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{errors.submit}</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Project'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
