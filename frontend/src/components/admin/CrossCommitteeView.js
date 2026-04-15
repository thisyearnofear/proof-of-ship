import React from 'react';
import { Card } from '@/components/common/Card';
import { 
  UsersIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function CrossCommitteeView({ expeditions }) {
  if (expeditions.length === 0) {
    return (
      <Card className="p-6 bg-gray-50 border-dashed">
        <p className="text-gray-500 text-sm text-center">No active expeditions found for your committees.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expeditions.map((exp) => (
        <Card key={exp.id} className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-gray-900">{exp.name}</h4>
              <p className="text-xs text-gray-500">{exp.hackathons.length} Hackathons in Expedition</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-blue-600">{Math.round(exp.progress)}%</span>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overall Progress</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 h-2 rounded-full mb-6 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${exp.progress}%` }}
            />
          </div>

          <div className="space-y-3">
            {exp.hackathons.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  {h.status === 'completed' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : h.status === 'active' ? (
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-900">{h.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{h.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {/* Mock committee members */}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full border border-white ${i < (h.status === 'completed' ? 3 : 1) ? 'bg-green-400' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                  <ChevronRightIcon className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
