/**
 * ProjectBackerSummary — Backer-facing summary card
 *
 * Shows: funding goal & status, backer count, verification status, quality score,
 * and a "Back this project" / "Leave feedback" call-to-action.
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import Button from '@/components/common/Button';
import { getProjectQuality } from '@/lib/projects/projectQuality';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChartBarIcon,
  HandThumbUpIcon,
} from '@heroicons/react/24/outline';

function StatBox({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-xl p-4 ${accent || 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? 'text-white' : 'text-gray-400'}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-white/80' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      <p className={`text-xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

export default function ProjectBackerSummary({ project, onBack, onFeedback }) {
  const quality = getProjectQuality(project);

  const backerCount = project.stats?.backerCount || project.backerCount || 0;
  const totalFunding = project.stats?.totalFunding || project.totalFunding || 0;
  const lookingForFunding = project.lookingForFunding;
  const fundingAmount = project.fundingAmount;

  const hasStats = backerCount > 0 || totalFunding > 0 || lookingForFunding;

  return (
    <Card className="p-5 border-0 shadow-lg rounded-2xl overflow-hidden">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <span className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
          <HandThumbUpIcon className="w-5 h-5 text-emerald-600" />
        </span>
        Support
      </h2>

      {/* Funding / Stats */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {totalFunding > 0 && (
            <StatBox
              icon={CurrencyDollarIcon}
              label="Raised"
              value={`$${Number(totalFunding).toLocaleString()}`}
            />
          )}
          {backerCount > 0 && (
            <StatBox
              icon={UserGroupIcon}
              label="Backers"
              value={backerCount}
            />
          )}
          {lookingForFunding && fundingAmount && (
            <StatBox
              icon={ChartBarIcon}
              label="Seeking"
              value={`$${Number(fundingAmount).toLocaleString()}`}
              accent="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
          )}
        </div>
      )}

      {/* Quality score callout */}
      <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4 mb-4">
        <SparklesIcon className="w-6 h-6 text-indigo-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-indigo-900">
            Listing quality: {quality.score}/100
          </p>
          <p className="text-xs text-indigo-600">
            {quality.tier} — {quality.missing.length > 0 ? `${quality.missing.length} signal${quality.missing.length > 1 ? 's' : ''} missing` : 'All key signals present'}
          </p>
        </div>
      </div>

      {/* Verification badge */}
      {project.verified && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800">Verified project</span>
        </div>
      )}

      {/* CTA buttons */}
      <div className="space-y-2">
        {onBack && (
          <Button
            variant="default"
            onClick={onBack}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
          >
            Back this project
          </Button>
        )}
        {onFeedback && (
          <Button variant="outline" onClick={onFeedback} className="w-full">
            Leave feedback
          </Button>
        )}
      </div>
    </Card>
  );
}
