import { useCallback, useEffect, useState } from 'react';
import { KeyIcon, ClipboardDocumentIcon, TrashIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/stores/authStore';
import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';

const SCOPES = [
  { id: 'projects:write', label: 'Create and update projects' },
  { id: 'proofs:write', label: "Post Ship's Log proofs" },
  { id: 'projects:delete', label: 'Delete projects', danger: true },
];

// Human-readable labels for audit actions recorded by the API.
const ACTION_LABELS = {
  key_created: 'Created API key',
  key_revoked: 'Revoked API key',
  project_created: 'Created project',
  project_updated: 'Updated project',
  project_deleted: 'Deleted project',
  proof_created: "Posted Ship's Log proof",
};

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortKeyId(keyId) {
  return keyId ? `${keyId.slice(0, 8)}…` : '—';
}

function CopyableCommand({ command }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg bg-gray-950 p-3 pr-16 text-xs leading-relaxed text-gray-100">
        <code>{command}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy command"
        className="absolute right-2 top-2 rounded p-1.5 text-gray-400 opacity-0 transition hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100"
      >
        {copied ? <span className="text-xs">Copied</span> : <ClipboardDocumentIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function DeveloperApiKeys() {
  const { currentUser } = useUser();
  const [keys, setKeys] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [label, setLabel] = useState('My coding agent');
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [scopes, setScopes] = useState(['projects:write', 'proofs:write']);
  const [newKey, setNewKey] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const token = await currentUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
  }, [currentUser]);

  const loadKeys = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/developer/keys');
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to load API keys');
      setKeys(Array.isArray(body.keys) ? body.keys : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, currentUser]);

  const loadActivity = useCallback(async () => {
    if (!currentUser) return;
    setActivityLoading(true);
    try {
      const response = await authenticatedFetch('/api/developer/activity?limit=15');
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to load activity');
      setActivity(Array.isArray(body.events) ? body.events : []);
    } catch (err) {
      // Activity is supplementary; don't block the whole panel on it.
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [authenticatedFetch, currentUser]);

  useEffect(() => { loadKeys(); loadActivity(); }, [loadKeys, loadActivity]);

  const toggleScope = (scope) => {
    setScopes((current) => current.includes(scope)
      ? current.filter((item) => item !== scope)
      : [...current, scope]);
  };

  const createKey = async () => {
    if (!scopes.length) {
      setError('Choose at least one capability.');
      return;
    }
    setCreating(true);
    setError(null);
    setNewKey(null);
    try {
      const response = await authenticatedFetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, scopes, expiresInDays: Number(expiresInDays) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to create API key');
      setNewKey(body.apiKey);
      await Promise.all([loadKeys(), loadActivity()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const revokeKey = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/developer/keys/${encodeURIComponent(revokeTarget.keyId)}`, {
        method: 'DELETE',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Failed to revoke API key');
      setRevokeTarget(null);
      await Promise.all([loadKeys(), loadActivity()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

  const activeKeys = keys.filter((key) => key.status === 'active');
  const labelByKeyId = Object.fromEntries(keys.map((key) => [key.keyId, key.label || 'Unnamed key']));

  return (
    <section className="rounded-xl border border-default bg-surface p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <KeyIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-primary">Developer API keys</h2>
          <p className="mt-1 text-sm text-secondary">
            Let coding agents manage your projects and publish proof without opening the dashboard.
          </p>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}

      {newKey && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Copy this key now—it will not be shown again.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-white p-3 text-xs text-gray-900 dark:bg-gray-950 dark:text-gray-100">{newKey}</code>
            <Button type="button" size="sm" variant="secondary" onClick={copyKey} leftIcon={<ClipboardDocumentIcon className="h-4 w-4" />}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <label className="text-xs font-medium text-secondary" htmlFor="api-key-label">Key name</label>
          <input id="api-key-label" value={label} maxLength={120} onChange={(event) => setLabel(event.target.value)} className="mt-1 w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary" />
        </div>
        <div>
          <label className="text-xs font-medium text-secondary" htmlFor="api-key-expiry">Expires</label>
          <select id="api-key-expiry" value={expiresInDays} onChange={(event) => setExpiresInDays(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary">
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-medium text-secondary">Capabilities</legend>
        <div className="mt-2 space-y-2">
          {SCOPES.map((scope) => (
            <label key={scope.id} className="flex items-center gap-2 text-sm text-primary">
              <input type="checkbox" checked={scopes.includes(scope.id)} onChange={() => toggleScope(scope.id)} className="rounded border-gray-300 text-blue-600" />
              <span className={scope.danger ? 'text-red-600 dark:text-red-400' : undefined}>{scope.label}</span>
              {scope.danger && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700 dark:bg-red-900/30 dark:text-red-300">Destructive</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="button" size="sm" className="mt-4" onClick={createKey} loading={creating}>Create API key</Button>

      <div className="mt-4 rounded-lg bg-surface-secondary p-3 text-xs text-secondary">
        Send the key in <code className="text-primary">x-api-key</code> and a unique value in{' '}
        <code className="text-primary">Idempotency-Key</code>. Supported mutations are{' '}
        <code className="text-primary">POST /api/projects</code>,{' '}
        <code className="text-primary">PUT /api/projects/:slug</code>, and{' '}
        <code className="text-primary">POST /api/projects/log</code>.
      </div>

      <div className="mt-6 border-t border-default pt-4">
        <h3 className="text-sm font-medium text-primary">Active keys</h3>
        {loading ? (
          <p className="mt-3 text-sm text-secondary">Loading keys…</p>
        ) : activeKeys.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">No active API keys.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {activeKeys.map((key) => (
              <div key={key.keyId} className="flex items-center justify-between gap-3 rounded-lg border border-default p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">{key.label || 'Unnamed key'}</p>
                  <p className="text-xs text-secondary">Expires {formatDate(key.expiresAt)} · Last used {formatDate(key.lastUsedAt)}</p>
                </div>
                <button type="button" onClick={() => setRevokeTarget(key)} className="rounded p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" aria-label={`Revoke ${key.label || 'API key'}`}>
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quickstart — the copy-paste path for handing a key to an agent. */}
      <div className="mt-6 border-t border-default pt-4">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-medium text-primary">Agent quickstart</h3>
        </div>
        <p className="mt-1 text-xs text-secondary">
          Replace <code className="text-primary">$API_KEY</code> with a key above and{' '}
          <code className="text-primary">https://your-domain</code> with this site&apos;s URL.
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium text-secondary">1. Verify the key works (identity + scopes)</p>
            <CopyableCommand command={'curl https://your-domain/api/developer/me \\\n  -H "x-api-key: $API_KEY"'} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-secondary">2. Post a shipping proof</p>
            <CopyableCommand command={'curl -X POST https://your-domain/api/projects/log \\\n  -H "x-api-key: $API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -H "Idempotency-Key: $(uuidgen)" \\\n  -d \'{"projectSlug":"your-project","message":"Shipped v1","type":"milestone"}\''} />
          </div>
        </div>
      </div>

      {/* Recent activity — the human trust surface for delegated access. */}
      <div className="mt-6 border-t border-default pt-4">
        <h3 className="text-sm font-medium text-primary">Recent activity</h3>
        {activityLoading ? (
          <p className="mt-3 text-sm text-secondary">Loading activity…</p>
        ) : activity.length === 0 ? (
          <p className="mt-3 text-sm text-secondary">No API activity yet. Events appear here when a key performs an action.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {activity.map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 text-primary">
                  <span className="font-medium">{ACTION_LABELS[event.action] || event.action || 'Action'}</span>
                  {event.resource && <span className="text-secondary"> · {event.resource}</span>}
                  {event.keyId && <span className="text-secondary"> · key {shortKeyId(event.keyId)}{labelByKeyId[event.keyId] ? ` (${labelByKeyId[event.keyId]})` : ''}</span>}
                </span>
                <span className="shrink-0 text-secondary">{formatDate(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revokeKey}
        title="Revoke API key?"
        message="The agent using this key will immediately lose access. This cannot be undone."
        confirmText="Revoke key"
        loading={revoking}
      />
    </section>
  );
}
