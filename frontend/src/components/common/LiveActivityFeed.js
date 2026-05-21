import React, { useState, useEffect, useCallback } from 'react';
import { RocketLaunchIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon, SparklesIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/feed?limit=10');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.activities)) {
        setActivities(data.activities);
      }
    } catch {
      // Silently fail — feed is cosmetic
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    // Poll every 30s for new activity
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  const getIcon = (type) => {
    switch (type) {
      case 'ship': return <RocketLaunchIcon className="w-4 h-4 text-blue-500" />;
      case 'fund': return <CurrencyDollarIcon className="w-4 h-4 text-green-500" />;
      case 'verify': return <SparklesIcon className="w-4 h-4 text-indigo-500" />;
      case 'follow': return <UserPlusIcon className="w-4 h-4 text-pink-500" />;
      default: return <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 shadow-sm max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Live Feed
        </h3>
        {!loading && activities.length > 0 && (
          <span className="text-[10px] text-blue-600 font-medium">REAL-TIME</span>
        )}
      </div>
      <div className="space-y-4 min-h-[120px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-2.5 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            No recent activity. Follow builders to see their updates here.
          </p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 animate-fade-in-up">
              <div className="mt-0.5 bg-blue-50 rounded-full p-1.5 h-fit">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-900 truncate">{activity.user}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{activity.time}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{activity.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
