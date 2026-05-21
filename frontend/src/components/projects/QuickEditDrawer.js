/**
 * Quick Edit Drawer
 *
 * Slide-out drawer for single-field inline editing of projects.
 * Triggered from BuilderProjectGrowth or the project detail page.
 * Saves changes to Firestore without leaving the current page.
 */

import React, { useState, useCallback } from 'react';
import Button from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import AccentColorPicker from '@/components/projects/AccentColorPicker';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const QUICK_FIELDS = [
  { key: 'name', label: 'Project name', type: 'text' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'twitter', label: 'Twitter / X', type: 'text' },
  { key: 'discord', label: 'Discord', type: 'text' },
  { key: 'tags', label: 'Tags (comma separated)', type: 'text' },
  { key: 'accentColor', label: 'Accent color', type: 'color' },
];

export default function QuickEditDrawer({ project, onClose, onSaved }) {
  const [field, setField] = useState(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSelectField = (key) => {
    setField(key);
    setValue(project?.[key] || '');
    setError(null);
    setSuccess(null);
  };

  const handleSave = useCallback(async () => {
    if (!field || !project?.slug) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { auth } = await import('@/lib/firebase/clientApp');
      const user = auth.currentUser;
      if (!user) throw new Error('You must be logged in');

      const token = await user.getIdToken();
      const payload = { [field]: field === 'tags' ? String(value).split(',').map(t => t.trim()).filter(Boolean) : value };

      const res = await fetch(`/api/projects/${project.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save');
      }

      setSuccess('Saved!');
      if (onSaved) onSaved({ ...project, [field]: value });
      setTimeout(() => {
        setField(null);
        setValue('');
        if (onClose) onClose();
      }, 800);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [field, value, project, onClose, onSaved]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (field) {
        setField(null);
      } else {
        onClose?.();
      }
    }
    if (e.key === 'Enter' && field && field !== 'description' && field !== 'tags') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto transition-transform">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Quick edit</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current project name */}
          <div className="pb-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{project?.name || 'Untitled'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Editing one field at a time — no full-page reload needed
            </p>
          </div>

          {/* Selected field editor */}
          {field ? (
            <div className="space-y-4">
              {field === 'accentColor' ? (
                <AccentColorPicker value={value} onChange={setValue} />
              ) : field === 'description' ? (
                <Textarea
                  label="Description"
                  value={String(value)}
                  onChange={(e) => setValue(e.target.value)}
                  rows={5}
                  placeholder="What does it do, who is it for, and what's onchain?"
                />
              ) : field === 'tags' ? (
                <Input
                  label="Tags"
                  value={String(value)}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="payments, defi, wallets"
                />
              ) : (
                <Input
                  label={QUICK_FIELDS.find((f) => f.key === field)?.label || field}
                  value={String(value)}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Enter ${field}`}
                />
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  {success}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} loading={saving}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => { setField(null); setError(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Field picker */}
              <p className="text-sm text-gray-600 mb-3">Choose a field to edit:</p>
              <div className="space-y-1.5">
                {QUICK_FIELDS.map((f) => {
                  const currentVal = project?.[f.key];
                  const hasValue = Boolean(currentVal);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => handleSelectField(f.key)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{f.label}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {f.key === 'accentColor'
                            ? currentVal || 'Default'
                            : hasValue
                            ? String(currentVal).substring(0, 60)
                            : 'Not set'}
                        </p>
                      </div>
                      {hasValue && (
                        <span className="ml-3 w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
