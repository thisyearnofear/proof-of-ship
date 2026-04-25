/**
 * Testing Campaigns Discovery Page
 * For testers to browse and join active testing campaigns
 */

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useActiveCampaigns } from '@/hooks/useActiveCampaigns';
import { useUser } from '@/contexts/UserContext';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import CampaignCard from '@/components/campaigns/CampaignCard';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function CampaignsPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { campaigns, loading, error, refresh } = useActiveCampaigns();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, reward, endDate

  const filteredAndSorted = useMemo(() => {
    let filtered = campaigns.filter(c => {
      const query = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.projectName?.toLowerCase().includes(query)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reward':
          return b.rewardAmount - a.rewardAmount;
        case 'endDate':
          return new Date(a.endDate) - new Date(b.endDate);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [campaigns, searchQuery, sortBy]);

  const handleJoinCampaign = (campaign) => {
    if (!currentUser) {
      router.push(`/login?redirectTo=/campaigns/${campaign.id}`);
      return;
    }
    router.push(`/campaigns/${campaign.id}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Head>
          <title>Testing Campaigns</title>
        </Head>
        <div className="max-w-6xl mx-auto px-4">
          <Card className="p-8 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Campaigns</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={refresh}>Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Testing Campaigns - Earn by Testing</title>
        <meta name="description" content="Discover and join testing campaigns to earn rewards" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <SparklesIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Testing Campaigns</h1>
            </div>
            <p className="text-lg text-gray-600">
              Discover active testing campaigns and earn rewards by finding bugs and providing feedback
            </p>
          </div>

          {/* Not logged in CTA */}
          {!currentUser && (
            <Card className="mb-8 p-6 bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Join the Testing Community</h3>
                  <p className="text-sm text-blue-800">
                    Sign in to submit your testing evidence and earn rewards
                  </p>
                </div>
                <Button onClick={() => router.push('/login')}>
                  Sign In
                </Button>
              </div>
            </Card>
          )}

          {/* Filter Bar */}
          <Card className="mb-8 p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="reward">Highest Reward</option>
                  <option value="endDate">Ending Soon</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAndSorted.length === 0 && (
            <Card className="p-12 text-center">
              <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {campaigns.length === 0 ? 'No campaigns yet' : 'No matching campaigns'}
              </h3>
              <p className="text-gray-600 mb-6">
                {campaigns.length === 0
                  ? 'Check back soon for new testing opportunities'
                  : 'Try adjusting your search or filters'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </Card>
          )}

          {/* Campaigns Grid */}
          {!loading && filteredAndSorted.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'campaign' : 'campaigns'} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSorted.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onJoin={handleJoinCampaign}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
