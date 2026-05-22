import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RocketLaunchIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon, SparklesIcon, UserPlusIcon } from '@heroicons/react/24/outline';

// Lazy singleton AudioContext for chime sound effects
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browsers require user gesture before audio plays)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Master gain envelope
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.15, now + 0.01);   // quick attack (10ms)
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45); // decay (440ms)
  masterGain.connect(ctx.destination);

  // Primary tone — A5 (880 Hz), sine wave
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  osc1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 0.45);

  // Harmonic overtone — C#6 (1108 Hz), slightly quieter, for a richer chime
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1108, now);
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.06, now);
  gain2.gain.linearRampToValueAtTime(0.06, now + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.35);
}

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  const knownIdsRef = useRef(new Set());

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/feed?limit=10');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.activities)) {
        // Detect newly added items
        const prevIds = knownIdsRef.current;
        const newIds = new Set();
        const currentIds = new Set();

        data.activities.forEach((a) => {
          currentIds.add(a.id);
          if (!prevIds.has(a.id) && prevIds.size > 0) {
            newIds.add(a.id);
          }
        });

        setActivities(data.activities);
        knownIdsRef.current = currentIds;

        // Trigger highlight animation + chime for new items
        if (newIds.size > 0) {
          // Only play chime if at least one new item is a follow event
          const hasNewFollow = data.activities.some(
            (a) => newIds.has(a.id) && a.type === 'follow'
          );
          if (hasNewFollow) playChime();

          setHighlightedIds((prev) => {
            const merged = new Set(prev);
            newIds.forEach((id) => merged.add(id));
            return merged;
          });
          // Clear highlights after animation completes
          setTimeout(() => {
            setHighlightedIds((prev) => {
              const next = new Set(prev);
              newIds.forEach((id) => next.delete(id));
              return next;
            });
          }, 3000);
        }
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
          activities.map((activity, index) => {
            const isNew = highlightedIds.has(activity.id);
            return (
              <div
                key={activity.id}
                className={`flex gap-3 ${isNew ? 'animate-fade-in-up' : 'animate-none'}`}
                style={{
                  animationDelay: isNew ? `${index * 80}ms` : '0ms',
                }}
              >
                <div
                  className={`relative mt-0.5 rounded-full p-1.5 h-fit transition-all duration-700 ${
                    isNew
                      ? 'bg-blue-200 ring-2 ring-blue-300 ring-offset-1'
                      : 'bg-blue-50'
                  }`}
                >
                  {getIcon(activity.type)}
                  {isNew && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                <div className={`flex-1 min-w-0 p-1 -m-1 rounded-lg transition-all duration-700 ${
                  isNew ? 'bg-blue-50/70 shadow-sm' : ''
                }`}>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">{activity.user}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{activity.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{activity.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
