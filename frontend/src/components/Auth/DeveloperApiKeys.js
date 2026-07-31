import { useCallback, useEffect, useState } from 'react';
import { KeyIcon, ClipboardDocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useUser } from '@/stores/authStore';
import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';

const SCOPES = [
  { id: 'projects:write', label: 'Create and update projects' },
  { id: 'proofs:write', label: "Post Ship's Log proofs" },
  { id: 'projects:delete', label: 'Delete projects' },
];

function formatDate(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
}

export default function DeveloperApiKeys() {
  const { currentUser } = useUser();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { loadKeys(); }, [loadKeys]);

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
      await loadKeys();
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
      await loadKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

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
              {scope.label}
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
        ) : keys.filter((key) => key.status === 'active').length === 0 ? (
          <p className="mt-3 text-sm text-secondary">No active API keys.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {keys.filter((key) => key.status === 'active').map((key) => (
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
