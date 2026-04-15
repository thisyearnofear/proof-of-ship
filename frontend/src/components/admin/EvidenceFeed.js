import React from 'react';
import { Card } from '@/components/common/Card';
import { 
  GitPullRequestIcon, 
  BoltIcon, 
  CubeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export default function EvidenceFeed({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 text-sm">No recent evidence found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="relative pl-6 pb-4 border-l border-gray-200 last:border-0 last:pb-0">
          <div className="absolute left-[-9px] top-0 bg-white p-1">
            {event.type === 'pr' ? (
              <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-600" />
              </div>
            ) : event.type === 'contract' ? (
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-600" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                {event.timestamp}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                event.type === 'pr' ? 'bg-purple-50 text-purple-700' : 
                event.type === 'contract' ? 'bg-blue-50 text-blue-700' : 
                'bg-green-50 text-green-700'
              }`}>
                {event.type.toUpperCase()}
              </span>
            </div>

            <h5 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1">
              {event.type === 'pr' && <BoltIcon className="w-3 h-3 text-purple-500" />}
              {event.type === 'contract' && <CubeIcon className="w-3 h-3 text-blue-500" />}
              {event.title}
            </h5>
            
            <p className="text-[11px] text-gray-600 line-clamp-2 mb-2 leading-relaxed">
              {event.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-500">
                {event.project}
              </span>
              <a 
                href={event.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
