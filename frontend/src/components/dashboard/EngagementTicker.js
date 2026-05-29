import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Card } from '@/components/common/Card';
import { RocketLaunchIcon, CheckBadgeIcon, BanknotesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const EngagementTicker = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(newActivities);
    }, (error) => {
      console.warn('Activity feed unavailable:', error.message);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'project_submitted':
        return <RocketLaunchIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'milestone_verified':
        return <CheckBadgeIcon className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'payout_processed':
        return <BanknotesIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case 'ships_log_update':
        return <ChartBarIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <Card className="overflow-hidden bg-slate-900 border-slate-700 text-white shadow-xl">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Proof of Ship
        </h3>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">STREAMS_ACTIVE</span>
      </div>
      <div className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-900/50">
        {activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-700 border-t-blue-500 mb-2"></div>
            <p className="text-slate-500 dark:text-slate-400 text-xs italic">Waiting for activity signals...</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex-shrink-0 mt-1 p-1 bg-slate-800 rounded border border-slate-700">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                  {activity.ecosystem && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${
                      activity.ecosystem === 'base' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' :
                      activity.ecosystem === 'celo' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                      'bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-700'
                    }`}>
                      {activity.ecosystem}
                    </span>
                  )}
                  {activity.amount && (
                    <span className="text-[9px] text-yellow-400 font-bold">
                      +{activity.amount} USDC
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="bg-slate-800/50 px-4 py-1.5 border-t border-slate-700 flex justify-center">
        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">SCANNING GLOBAL ARMADA</div>
      </div>
    </Card>
  );
};

export default EngagementTicker;
