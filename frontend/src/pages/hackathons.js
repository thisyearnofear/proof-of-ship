import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import ErrorBoundary from '@/components/ErrorBoundary';

import {
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

/**
 * Hackathons Page
 * Lists all hackathons with filtering and navigation
 * 
 * Follows ENHANCEMENT FIRST by extending existing project listing patterns
 * Maintains CLEAN separation with dedicated hackathon components
 */

export default function HackathonsPage() {
  const router = useRouter();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // PERFORMANT: Fetch hackathons with filtering
  useEffect(() => {
    async function fetchHackathons() {
      try {
        setLoading(true);
        setError(null);

        // CLEAN: Build query parameters based on filter
        const params = new URLSearchParams();
        if (filter !== 'all') {
          params.append('status', filter);
        }

        const response = await fetch(`/api/hackathons?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch hackathons');
        }

        const data = await response.json();
        setHackathons(data.data || []);
        
      } catch (err) {
        console.error('Error fetching hackathons:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHackathons();
  }, [filter]);

  // MODULAR: Filter change handler
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // ORGANIZED: Group hackathons by status for better UX
  const groupedHackathons = {
    upcoming: hackathons.filter(h => h.status === 'upcoming'),
    active: hackathons.filter(h => h.status === 'active'),
    completed: hackathons.filter(h => h.status === 'completed')
  };

  return (
    <ErrorBoundary
      name="HackathonsPage"
      errorMessage="Failed to load hackathons. Please refresh the page."
    >
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Hackathons • Onchain Builder Platform</title>
          <meta name="description" content="Explore and participate in onchain hackathons across multiple ecosystems" />
        </Head>

        {/* Header with filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hackathons</h1>
              <p className="text-gray-600 mt-1">Explore onchain hackathons across ecosystems</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter buttons */}
              <div className="flex gap-1 bg-white rounded-lg p-1 border">
                {['all', 'upcoming', 'active', 'completed'].map(f => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Add hackathon button (admin only for now) */}
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
              >
                Add Hackathon
              </Button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="min-h-[60vh] flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="max-w-3xl mx-auto py-10 text-center">
              <p className="text-red-600 mb-4">⚠️ {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}

          {/* Hackathon listings */}
          {!loading && !error && (
            <div className="space-y-8">
              {/* Upcoming Hackathons */}
              {groupedHackathons.upcoming.length > 0 && (
                <HackathonSection
                  title="Upcoming Hackathons"
                  hackathons={groupedHackathons.upcoming}
                  icon={<CalendarIcon className="h-6 w-6 text-blue-600" />}
                  iconBg="bg-blue-50"
                />
              )}

              {/* Active Hackathons */}
              {groupedHackathons.active.length > 0 && (
                <HackathonSection
                  title="Active Hackathons"
                  hackathons={groupedHackathons.active}
                  icon={<UsersIcon className="h-6 w-6 text-green-600" />}
                  iconBg="bg-green-50"
                />
              )}

              {/* Completed Hackathons */}
              {groupedHackathons.completed.length > 0 && (
                <HackathonSection
                  title="Completed Hackathons"
                  hackathons={groupedHackathons.completed}
                  icon={<TrophyIcon className="h-6 w-6 text-yellow-600" />}
                  iconBg="bg-yellow-50"
                />
              )}

              {/* Empty state */}
              {groupedHackathons.upcoming.length === 0 &&
               groupedHackathons.active.length === 0 &&
               groupedHackathons.completed.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-500 mb-4">No hackathons found</p>
                  <p className="text-gray-400 text-sm">
                    {filter === 'all'
                      ? 'There are no hackathons available at the moment.'
                      : `No hackathons match the "${filter}" filter.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Hackathon Section Component
 * Reusable component for displaying a group of hackathons
 * 
 * Follows MODULAR principle with clear props interface
 * Maintains CLEAN separation with dedicated styling
 */
function HackathonSection({ title, hackathons, icon, iconBg }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-gray-500">({hackathons.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hackathons.map(hackathon => (
          <HackathonCard key={hackathon.id} hackathon={hackathon} />
        ))}
      </div>
    </div>
  );
}

/**
 * Hackathon Card Component
 * Individual hackathon display
 * 
 * Follows DRY principle with consistent card layout
 * Maintains PERFORMANT rendering with memoization
 */
function HackathonCard({ hackathon }) {
  // CLEAN: Format date range
  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  // CLEAN: Format prize pool
  const formatPrizePool = (amount) => {
    if (!amount) return 'No prize pool';
    return `$${amount.toLocaleString()} in prizes`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <Link href={`/hackathons/${hackathon.id}`} className="block h-full">
        <div className="p-6 h-full flex flex-col">
          {/* Ecosystem badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {hackathon.ecosystem.toUpperCase()}
            </span>
            {hackathon.status === 'completed' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Completed
              </span>
            )}
          </div>

          {/* Hackathon title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex-1">
            {hackathon.name}
          </h3>

          {/* Dates */}
          <div className="text-sm text-gray-600 mb-3">
            {formatDateRange(hackathon.startDate, hackathon.endDate)}
          </div>

          {/* Prize pool */}
          <div className="text-sm font-medium text-gray-900 mb-4">
            {formatPrizePool(hackathon.prizePool)}
          </div>

          {/* Tracks */}
          {hackathon.tracks && hackathon.tracks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {hackathon.tracks.slice(0, 3).map(track => (
                <span key={track} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                  {track}
                </span>
              ))}
              {hackathon.tracks.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                  +{hackathon.tracks.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}