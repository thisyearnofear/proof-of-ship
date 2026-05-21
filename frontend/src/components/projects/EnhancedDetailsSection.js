/**
 * EnhancedDetailsSection — Progressive disclosure of optional project detail fields
 *
 * Shows fields when they exist: tagline, problem, solution, target users,
 * use of funds, risks, demo/media links, proof links.
 * Uses an accordion pattern to avoid overwhelming the page.
 */

import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  CurrencyDollarIcon,
  FilmIcon,
  DocumentTextIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

function DetailSection({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color || 'bg-gray-200'}`}>
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {label}
          </p>
          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MediaLink({ url, label }) {
  if (!url) return null;
  const displayLabel = label || (() => {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url;
    }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
    >
      <FilmIcon className="w-4 h-4" />
      <span className="truncate max-w-[200px]">{displayLabel}</span>
    </a>
  );
}

export default function EnhancedDetailsSection({ project }) {
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    { icon: LightBulbIcon, label: 'Problem', value: project.problem, color: 'bg-amber-100' },
    { icon: LightBulbIcon, label: 'Solution', value: project.solution, color: 'bg-emerald-100' },
    { icon: UsersIcon, label: 'Target users', value: project.targetUsers, color: 'bg-blue-100' },
    { icon: CurrencyDollarIcon, label: 'Use of funds', value: project.useOfFunds, color: 'bg-purple-100' },
    { icon: ExclamationTriangleIcon, label: 'Risks', value: project.risks, color: 'bg-red-100' },
    { icon: DocumentTextIcon, label: 'Roadmap / Notes', value: project.roadmap, color: 'bg-teal-100' },
  ];

  const hasSections = sections.some((s) => s.value);
  const hasMedia = Array.isArray(project.demoLinks) && project.demoLinks.length > 0;
  const hasProofLinks = Array.isArray(project.proofLinks) && project.proofLinks.length > 0;
  const hasTagline = project.tagline;

  if (!hasSections && !hasMedia && !hasProofLinks && !hasTagline) return null;

  const visibleCount = [hasTagline, hasSections, hasMedia, hasProofLinks].filter(Boolean).length;

  return (
    <Card className="p-5 border-0 shadow-lg rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <LightBulbIcon className="w-5 h-5 text-amber-600" />
          </span>
          Details
          {!isOpen && visibleCount > 0 && (
            <span className="text-xs font-normal text-gray-400 ml-1">
              ({visibleCount} section{visibleCount > 1 ? 's' : ''})
            </span>
          )}
        </h2>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Tagline */}
          {hasTagline && (
            <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border border-indigo-100">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-500 mb-1">Tagline</p>
              <p className="text-lg font-bold text-indigo-900 leading-snug">{project.tagline}</p>
            </div>
          )}

          {/* Detail sections */}
          {sections.map((s) => (
            <DetailSection key={s.label} {...s} />
          ))}

          {/* Demo / media links */}
          {hasMedia && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Demos & media</p>
              <div className="flex flex-wrap gap-2">
                {project.demoLinks.map((link, i) => (
                  <MediaLink
                    key={i}
                    url={typeof link === 'string' ? link : link.url}
                    label={typeof link === 'object' ? link.label : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Proof links */}
          {hasProofLinks && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Proof links</p>
              <div className="flex flex-wrap gap-2">
                {project.proofLinks.map((link, i) => (
                  <MediaLink
                    key={i}
                    url={typeof link === 'string' ? link : link.url}
                    label={typeof link === 'object' ? link.label : null}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
