/**
 * Create New Campaign Page
 * For developers to create testing campaigns
 * 
 * Uses:
 * - CampaignForm for multi-step form
 * - useCampaigns for creation
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import useCampaigns from '@/hooks/useCampaigns';
import { CampaignForm } from '@/components/campaigns';
import { Card } from '@/components/common/Card';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { createCampaign, loading, error } = useCampaigns();
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Check authentication
  useEffect(() => {
    if (currentUser === false) {
      router.push('/login?redirectTo=/campaigns/new');
    }
  }, [currentUser, router]);

  // Load projects for dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // TODO: Load user's projects from Firestore
        // For now, use mock data
        setProjects([
          { id: 'proj1', name: 'Project Alpha' },
          { id: 'proj2', name: 'Project Beta' },
        ]);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };

    if (currentUser) {
      loadProjects();
    }
  }, [currentUser]);

  const handleSave = async (campaignData, publish = false) => {
    setCreating(true);
    setCreateError(null);

    try {
      const data = {
        ...campaignData,
        creatorId: currentUser.uid,
        status: publish ? 'open' : 'draft',
      };

      const campaignId = await createCampaign(data);

      if (publish) {
        // Redirect to published campaign
        router.push(`/campaigns/${campaignId}`);
      } else {
        // Stay on form with success message
        alert('Campaign saved as draft!');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setCreateError(err.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  if (currentUser === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md">
          <div className="text-center">
            <div className="animate-spin inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser === false) {
    return null; // Redirect happens in useEffect
  }

  return (
    <>
      <Head>
        <title>Create Testing Campaign</title>
        <meta name="description" content="Create a new testing campaign for your project" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Create Testing Campaign
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Set up a campaign to get testers to find bugs and provide feedback on your project
            </p>
          </div>

          {/* Error Alert */}
          {(error || createError) && (
            <Card className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-300">Error</p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    {error || createError}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Form */}
          <CampaignForm
            initialData={null}
            onSave={handleSave}
            projects={projects}
          />

          {/* Help Text */}
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Tips for a Great Campaign</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>✓ Be specific about what you want tested</li>
              <li>✓ Provide clear step-by-step test scenarios</li>
              <li>✓ Set a competitive reward to attract quality testers</li>
              <li>✓ Set a realistic deadline (at least 1 week)</li>
              <li>✓ Define success metrics so testers know what you&apos;re looking for</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
