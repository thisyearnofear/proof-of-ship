/**
 * ProjectLinksPanel — Organized links for a project
 *
 * Shows: GitHub, Website/Demo, Twitter/X, Discord, and other URLs
 * in a clean, actionable card layout.
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import { ArrowTopRightOnSquareIcon, CodeBracketIcon, GlobeAltIcon, HashtagIcon, ChatBubbleLeftRightIcon, LinkIcon } from '@heroicons/react/24/outline';

const LINK_DEFS = [
  {
    key: 'github',
    label: 'GitHub',
    icon: CodeBracketIcon,
    color: 'bg-gray-100 text-gray-700',
    hoverColor: 'hover:bg-gray-200',
    getUrl: (project) => {
      if (project.githubUrl) return project.githubUrl;
      if (project.owner && project.repo) return `https://github.com/${project.owner}/${project.repo}`;
      return null;
    },
  },
  {
    key: 'website',
    label: 'Website',
    icon: GlobeAltIcon,
    color: 'bg-blue-100 text-blue-700',
    hoverColor: 'hover:bg-blue-200',
    getUrl: (project) => project.website || project.liveUrl || null,
  },
  {
    key: 'twitter',
    label: 'X / Twitter',
    icon: HashtagIcon,
    color: 'bg-sky-100 text-sky-700',
    hoverColor: 'hover:bg-sky-200',
    getUrl: (project) => {
      if (!project.twitter) return null;
      const handle = project.twitter.replace('@', '');
      return `https://x.com/${handle}`;
    },
  },
  {
    key: 'discord',
    label: 'Discord',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-indigo-100 text-indigo-700',
    hoverColor: 'hover:bg-indigo-200',
    getUrl: (project) => {
      if (!project.discord) return null;
      return project.discord.startsWith('http') ? project.discord : `https://discord.gg/${project.discord}`;
    },
  },
];

export default function ProjectLinksPanel({ project }) {
  const available = LINK_DEFS.filter((def) => def.getUrl(project));

  if (available.length === 0) return null;

  return (
    <Card className="p-5 border-0 shadow-lg rounded-2xl overflow-hidden">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
          <LinkIcon className="w-5 h-5 text-blue-600" />
        </span>
        Links
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {available.map((def) => {
          const url = def.getUrl(project);
          return (
            <a
              key={def.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${def.color} ${def.hoverColor} group`}
            >
              <def.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{def.label}</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </Card>
  );
}
