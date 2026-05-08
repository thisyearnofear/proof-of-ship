import React, { useState, useEffect } from 'react';
import { RocketLaunchIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon, SparklesIcon } from '@heroicons/react/24/outline';

const MOCK_ACTIVITIES = [
  { id: 1, type: 'ship', user: 'alice.sol', message: 'Deployed v2 of the smart contracts', time: '2m ago' },
  { id: 2, type: 'fund', user: 'bob.eth', message: 'Backed "DeFi Voyager" with 500 USDC', time: '5m ago' },
  { id: 3, type: 'verify', user: 'Verifier Agent', message: 'Verified milestone "Frontend MVP" for Project X', time: '12m ago' },
  { id: 4, type: 'ship', user: 'charlie.sol', message: 'Added SNS support to the dashboard', time: '15m ago' },
];

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  useEffect(() => {
    // In a real app, this would be a websocket or firestore listener
    const interval = setInterval(() => {
      // Rotate activities for demo feel
      setActivities(prev => {
        const last = prev[prev.length - 1];
        return [ { ...last, id: Date.now(), time: 'Just now' }, ...prev.slice(0, 3)];
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'ship': return <RocketLaunchIcon className="w-4 h-4 text-blue-500" />;
      case 'fund': return <CurrencyDollarIcon className="w-4 h-4 text-green-500" />;
      case 'verify': return <SparklesIcon className="w-4 h-4 text-indigo-500" />;
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
          Live Ship Feed
        </h3>
        <span className="text-[10px] text-blue-600 font-medium">REAL-TIME</span>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
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
        ))}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
