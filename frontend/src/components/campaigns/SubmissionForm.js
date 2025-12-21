/**
 * Campaign Submission Form
 * Multi-step form for testers to submit results
 * Sections: Test Results → Feedback & Rating → Evidence
 * 
 * Core Principles:
 * - MODULAR: Each step is independent and testable
 * - DRY: Reuses validation from schemas
 * - CLEAN: No form state complexity, single onChange handler
 * - PERFORMANT: Lazy file upload, no unnecessary re-renders
 */

import { useState, useEffect, useRef } from 'react';
import { sanitizeSubmission, validateCampaignSubmission } from '@/schemas/campaign';
import { StarIcon } from '@heroicons/react/24/solid';
import { TrashIcon } from '@heroicons/react/24/outline';

const STEPS = [
  { id: 'results', label: 'Test Results' },
  { id: 'feedback', label: 'Feedback & Rating' },
  { id: 'evidence', label: 'Evidence' },
];

export default function SubmissionForm({
  campaign,
  onSubmit = null,
  isLoading = false,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(getDefaultData(campaign));
  const [errors, setErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState('');
  const fileInputRef = useRef(null);

  // Auto-save draft
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem(
        `submission_draft_${campaign.id}`,
        JSON.stringify(formData)
      );
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [formData, campaign.id]);

  // Load draft if exists
  useEffect(() => {
    const saved = localStorage.getItem(`submission_draft_${campaign.id}`);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [campaign.id]);

  const handleChange = (path, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let obj = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }

      obj[keys[keys.length - 1]] = value;
      return updated;
    });

    if (errors[path]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[path];
        return updated;
      });
    }
  };

  const validateStep = () => {
    const stepErrors = {};

    switch (currentStep) {
      case 0: // Test Results
        if (!formData.results?.scenarioResults || formData.results.scenarioResults.length === 0) {
          stepErrors.scenarios = 'Mark all test scenarios as pass/fail';
        } else {
          formData.results.scenarioResults.forEach((result, idx) => {
            if (result.passed === undefined || result.passed === null) {
              stepErrors[`scenario_${idx}`] = 'Mark as pass or fail';
            }
          });
        }
        break;

      case 1: // Feedback & Rating
        if (!formData.results?.overallRating || formData.results.overallRating < 1 || formData.results.overallRating > 5) {
          stepErrors['rating'] = 'Select a rating (1-5 stars)';
        }
        if (!formData.results?.feedback || formData.results.feedback.length < 10) {
          stepErrors['feedback'] = 'Feedback must be at least 10 characters';
        }
        break;

      case 2: // Evidence (optional but encouraged)
        // No hard requirements, but validation happens on submit
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleAddFile = (type) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const evidence = {
        type,
        url: e.target.result,
        description: '',
        name: file.name,
        size: file.size,
      };

      setFormData(prev => ({
        ...prev,
        results: {
          ...prev.results,
          evidence: [...(prev.results.evidence || []), evidence],
        },
      }));
    };

    reader.readAsDataURL(file);
    fileInputRef.current.value = '';
  };

  const handleRemoveEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      results: {
        ...prev.results,
        evidence: prev.results.evidence.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async () => {
    const validation = validateCampaignSubmission(formData);
    if (!validation.isValid) {
      setErrors({ form: validation.errors.join('; ') });
      return;
    }

    try {
      const sanitized = sanitizeSubmission(formData);
      sanitized.status = 'submitted';
      sanitized.submittedAt = new Date().toISOString();

      if (onSubmit) {
        await onSubmit(sanitized);
      }

      setSavedMessage('Submission sent for review');
      localStorage.removeItem(`submission_draft_${campaign.id}`);
    } catch (error) {
      setErrors({ form: error.message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-gray-300 dark:bg-gray-600" />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {STEPS[currentStep].label}
        </div>
      </div>

      {/* Errors */}
      {errors.form && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {errors.form}
        </div>
      )}

      {/* Success */}
      {savedMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {savedMessage}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        {currentStep === 0 && <StepResults formData={formData} campaign={campaign} errors={errors} handleChange={handleChange} />}
        {currentStep === 1 && <StepFeedback formData={formData} errors={errors} handleChange={handleChange} />}
        {currentStep === 2 && (
          <StepEvidence
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleAddFile={handleAddFile}
            handleRemoveEvidence={handleRemoveEvidence}
            fileInputRef={fileInputRef}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Previous
        </button>

        {currentStep === STEPS.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit Results'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// Step Components
function StepResults({ formData, campaign, errors, handleChange }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Mark each test scenario as pass or fail
      </p>

      {campaign.testScenarios?.map((scenario, idx) => (
        <div key={scenario.id} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{scenario.title}</h4>
          
          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Expected result:</p>
            <p className="text-gray-900 dark:text-white">{scenario.expectedResult}</p>
          </div>

          <div className="flex gap-4 mb-3">
            <button
              onClick={() => {
                const updated = [...(formData.results?.scenarioResults || [])];
                if (!updated[idx]) updated[idx] = { scenarioId: scenario.id };
                updated[idx].passed = true;
                handleChange('results.scenarioResults', updated);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                formData.results?.scenarioResults?.[idx]?.passed === true
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              ✓ Pass
            </button>
            <button
              onClick={() => {
                const updated = [...(formData.results?.scenarioResults || [])];
                if (!updated[idx]) updated[idx] = { scenarioId: scenario.id };
                updated[idx].passed = false;
                handleChange('results.scenarioResults', updated);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                formData.results?.scenarioResults?.[idx]?.passed === false
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              ✗ Fail
            </button>
          </div>

          <textarea
            value={formData.results?.scenarioResults?.[idx]?.notes || ''}
            onChange={(e) => {
              const updated = [...(formData.results?.scenarioResults || [])];
              if (!updated[idx]) updated[idx] = { scenarioId: scenario.id };
              updated[idx].notes = e.target.value;
              handleChange('results.scenarioResults', updated);
            }}
            placeholder="Add notes (optional)"
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
          />

          {errors[`scenario_${idx}`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[`scenario_${idx}`]}</p>
          )}
        </div>
      ))}

      {errors.scenarios && (
        <p className="text-sm text-red-600 dark:text-red-400">{errors.scenarios}</p>
      )}
    </div>
  );
}

function StepFeedback({ formData, errors, handleChange }) {
  const rating = formData.results?.overallRating || 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
          Overall Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => handleChange('results.overallRating', star)}
              className="p-1 hover:scale-110 transition"
            >
              <StarIcon
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.rating}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
          Feedback <span className="text-gray-500 text-xs">({formData.results?.feedback?.length || 0}/2000)</span>
        </label>
        <textarea
          value={formData.results?.feedback || ''}
          onChange={(e) => handleChange('results.feedback', e.target.value.substring(0, 2000))}
          placeholder="Share your testing experience, suggestions, and observations..."
          rows="4"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.feedback && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.feedback}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
          Bugs Found (Optional)
        </label>
        <div className="space-y-2">
          {formData.results?.bugsSeverity?.map((bug, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <select
                value={bug.severity}
                onChange={(e) => {
                  const updated = [...formData.results.bugsSeverity];
                  updated[idx].severity = e.target.value;
                  handleChange('results.bugsSeverity', updated);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="text"
                value={bug.description}
                onChange={(e) => {
                  const updated = [...formData.results.bugsSeverity];
                  updated[idx].description = e.target.value;
                  handleChange('results.bugsSeverity', updated);
                }}
                placeholder="Bug description"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={() => {
                  const updated = formData.results.bugsSeverity.filter((_, i) => i !== idx);
                  handleChange('results.bugsSeverity', updated);
                }}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const updated = [...(formData.results?.bugsSeverity || [])];
              updated.push({ severity: 'medium', description: '' });
              handleChange('results.bugsSeverity', updated);
            }}
            className="text-sm px-3 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            + Add Bug
          </button>
        </div>
      </div>
    </div>
  );
}

function StepEvidence({
  formData,
  errors,
  handleChange,
  handleAddFile,
  handleRemoveEvidence,
  fileInputRef,
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Add screenshots, logs, or other evidence to support your findings
      </p>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Upload Evidence (Optional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const type = e.target.files?.[0]?.name.endsWith('.log')
              ? 'log'
              : e.target.files?.[0]?.name.match(/\.(mp4|webm)$/)
              ? 'video'
              : 'screenshot';
            handleAddFile(type);
          }}
        />

        <div className="flex gap-2">
          <button
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm font-semibold"
          >
            + Add File
          </button>
        </div>
      </div>

      {/* Uploaded Evidence */}
      {formData.results?.evidence && formData.results.evidence.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Uploaded Evidence ({formData.results.evidence.length})
          </label>
          {formData.results.evidence.map((evidence, idx) => (
            <div
              key={idx}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg flex items-start justify-between"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {evidence.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(evidence.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <textarea
                  value={evidence.description}
                  onChange={(e) => {
                    const updated = [...formData.results.evidence];
                    updated[idx].description = e.target.value;
                    handleChange('results.evidence', updated);
                  }}
                  placeholder="Describe this evidence..."
                  rows="2"
                  className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={() => handleRemoveEvidence(idx)}
                className="ml-2 p-1 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getDefaultData(campaign) {
  return {
    campaignId: campaign.id,
    testerId: '', // Set by hook
    results: {
      scenarioResults: campaign.testScenarios?.map(s => ({
        scenarioId: s.id,
        passed: null,
        notes: '',
      })) || [],
      overallRating: 0,
      feedback: '',
      evidence: [],
      bugsSeverity: [],
    },
    status: 'draft',
  };
}
