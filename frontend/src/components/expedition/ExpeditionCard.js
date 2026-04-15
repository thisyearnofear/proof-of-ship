/**
 * ExpeditionCard Component
 * ROI-focused project card for backers
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import ProjectHealthChart from './ProjectHealthChart';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function ExpeditionCard({ project, onBack }) {
  const progress = (project.totalBacked / project.targetFunding) * 100;
  
  return (
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-t-4 border-blue-500">
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-xl text-gray-900 line-clamp-1">{project.name || project.slug}</h3>
            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {project.category}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-blue-600 uppercase">Multiplier</div>
            <div className="text-2xl font-black text-blue-700">{project.activeMultiplier}x</div>
          </div>
        </div>

        {/* ROI Highlight */}
        <div className="bg-green-50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Projected ROI</span>
          </div>
          <span className="text-lg font-bold text-green-700">+{project.projectedROI}%</span>
        </div>

        {/* Health & Confidence */}
        <div className="mb-6">
          <ProjectHealthChart 
            health={project.health} 
            confidence={project.confidence} 
          />
        </div>

        {/* Funding Stats */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>Total Backed</span>
            </div>
            <span className="font-bold text-gray-900">${project.totalBacked?.toLocaleString()}</span>
          </div>
          
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(progress)}% of target</span>
            <span>Target: ${project.targetFunding?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 bg-gray-50 border-t border-gray-100 mt-auto">
        <Button 
          variant="primary" 
          className="w-full py-3 text-base font-bold shadow-blue-200 shadow-lg flex items-center justify-center gap-2"
          onClick={() => onBack(project)}
        >
          <ShieldCheckIcon className="w-5 h-5" />
          Scout & Back Project
        </Button>
      </div>
    </Card>
  );
}
