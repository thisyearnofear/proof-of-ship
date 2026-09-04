import { ShieldCheckIcon } from '@heroicons/react/24/outline';

/**
 * AttestcoinBadge — surface a milestone attestation in the UI.
 *
 * Props:
 * - attestation: a MilestoneAttestation from the Attestcoin service
 * - size: 'sm' | 'md' | 'lg'
 * - className: extra classes
 */
export default function AttestcoinBadge({ attestation, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const iconClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const verified = attestation?.status === 'verified';
  const uid = attestation?.attestationUid || 'pending';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold border shadow-sm ${
        verified
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-amber-50 text-amber-700 border-amber-100'
      } ${sizeClasses[size]} ${className}`}
      title={`Attestcoin UID: ${uid}`}
    >
      <ShieldCheckIcon className={`${iconClasses[size]} ${verified ? 'text-emerald-500' : 'text-amber-500'}`} />
      <span>{verified ? 'Attestcoin Verified' : 'Attestcoin Pending'}</span>
    </div>
  );
}
