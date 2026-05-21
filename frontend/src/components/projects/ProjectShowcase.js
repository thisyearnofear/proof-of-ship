import Button from '@/components/common/Button';
import ShareButtons from '@/components/common/ShareButtons';
import { getProjectQuality } from '@/lib/projects/projectQuality';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export function ProjectHero({ project, ecosystemConfig, title, githubUrl, canEdit, onEdit, onOpen }) {
  const quality = getProjectQuality(project);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      {project.imageUrl && (
        <div className="aspect-[16/7] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
          <img src={project.imageUrl} alt={title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                {title}
              </h1>
              {project.description && (
                <p className="mt-3 text-lg leading-relaxed text-gray-600 dark:text-gray-300 max-w-3xl">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {ecosystemConfig && (
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  <span>{ecosystemConfig.icon}</span>
                  <span>{ecosystemConfig.shortName}</span>
                </span>
              )}

              {project.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <TagIcon className="w-4 h-4" />
                  {project.category}
                </span>
              )}

              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                {quality.score}/100 listing
              </span>

              {project.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/30 px-3 py-1.5 text-sm font-semibold text-green-700 dark:text-green-300">
                  <CheckCircleIcon className="w-4 h-4" />
                  Verified
                </span>
              )}

              {project.status && project.status !== 'approved' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <ClockIcon className="w-4 h-4" />
                  {String(project.status).replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <ShareButtons title={title} className="pt-1" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canEdit && (
              <Button variant="outline" onClick={onEdit} leftIcon={<PencilSquareIcon className="w-5 h-5" />}>
                Edit
              </Button>
            )}

            {githubUrl && (
              <Button
                variant="outline"
                onClick={() => onOpen(githubUrl)}
                rightIcon={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
              >
                GitHub
              </Button>
            )}

            {(project.liveUrl || project.website) && (
              <Button
                onClick={() => onOpen(project.liveUrl || project.website)}
                rightIcon={<ArrowTopRightOnSquareIcon className="w-5 h-5" />}
              >
                Demo
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectProofPanel({ project, ownerEthosLoading, ownerEthosUser, EthosScoreBadge }) {
  const proofItems = [
    { label: 'Repository', value: project.owner && project.repo ? `${project.owner}/${project.repo}` : null },
    { label: 'Contract', value: project.contractAddress },
    { label: 'Deployment Tx', value: project.deploymentTxHash },
    { label: 'Open source', value: project.isOpenSource ? 'Yes' : 'Not marked' },
    { label: 'Website', value: project.website || project.liveUrl },
    { label: 'X / Twitter', value: project.twitter },
    { label: 'Discord', value: project.discord }
  ];

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Proof signals</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        The public evidence backers and verifiers use to build confidence.
      </p>

      <div className="mt-4 space-y-3">
        {proofItems.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right break-all">
              {item.value || '-'}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Submitted by</span>
          <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {project.submittedBy || '-'}
            {project.ownerWalletAddress && (
              ownerEthosLoading ? (
                <span className="text-xs text-gray-500">Loading</span>
              ) : ownerEthosUser ? (
                <EthosScoreBadge score={ownerEthosUser.score} ethosUser={ownerEthosUser} size="sm" showLabel={false} />
              ) : null
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

export function ProjectMilestoneTimeline({ milestones }) {
  if (!Array.isArray(milestones) || milestones.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Milestone plan</h2>
      <div className="mt-4 space-y-3">
        {milestones.map((milestone, index) => (
          <div key={`${milestone}-${index}`} className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-gray-100 dark:text-gray-900">
              {index + 1}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{milestone}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
