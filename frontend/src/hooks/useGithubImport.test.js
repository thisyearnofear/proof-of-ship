/**
 * useGithubImport — auto-populate project fields from a GitHub URL.
 *
 * Verifies:
 *  - fetches metadata when the URL changes (new value from initial '')
 *  - skips when URL is unchanged across renders
 *  - skips when URL is not a github.com URL
 *  - rejects URLs from a different owner (when githubUsername is set)
 *  - merges incoming fields into form without clobbering existing values
 *  - duplicate warning appears after the 1.5s debounce
 *  - duplicate warning is cleared when URL is no longer a GitHub URL
 *  - duplicate check is skipped in edit mode
 *  - no fetch when the API returns a non-ok response
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { checkDuplicateGitHubUrl, fetchMock } = vi.hoisted(() => ({
  checkDuplicateGitHubUrl: vi.fn(async () => null),
  fetchMock: vi.fn(),
}));

vi.mock('@/lib/projects/projectNormalize', () => ({
  checkDuplicateGitHubUrl,
}));

vi.mock('@/lib/firebase/clientApp', () => ({
  db: { __fake: 'db' },
  storage: { __fake: 'storage' },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
}));

global.fetch = fetchMock;

import { useGithubImport } from './useGithubImport';

beforeEach(() => {
  fetchMock.mockReset();
  checkDuplicateGitHubUrl.mockReset();
  checkDuplicateGitHubUrl.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useGithubImport', () => {
  it('fetches metadata when the URL changes to a new GitHub URL', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        project: { name: 'Imported', description: 'd', website: 'w', tags: ['x'], isOpenSource: true },
      }),
    });

    const { rerender } = renderHook(
      ({ url }) =>
        useGithubImport({
          githubUrl: url,
          isEditMode: false,
          githubUsername: 'alice',
          setForm: vi.fn(),
          setError: vi.fn(),
        }),
      { initialProps: { url: '' } }
    );

    rerender({ url: 'https://github.com/alice/cool' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('fires fetch once on initial mount with a URL and does not re-fetch on stable re-renders', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ project: {} }) });
    const { rerender } = renderHook(
      ({ url }) =>
        useGithubImport({ githubUrl: url, isEditMode: false, setForm: vi.fn() }),
      { initialProps: { url: 'https://github.com/a/b' } }
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    rerender({ url: 'https://github.com/a/b' });
    rerender({ url: 'https://github.com/a/b' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('skips fetch when the URL is not a github.com URL', async () => {
    const { rerender } = renderHook(
      ({ url }) =>
        useGithubImport({ githubUrl: url, isEditMode: false, setForm: vi.fn() }),
      { initialProps: { url: '' } }
    );
    rerender({ url: 'https://gitlab.com/a/b' });
    await act(async () => { await Promise.resolve(); });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects URLs from a different owner and reports the error', async () => {
    const setError = vi.fn();
    const { rerender } = renderHook(
      ({ url }) =>
        useGithubImport({
          githubUrl: url,
          isEditMode: false,
          githubUsername: 'alice',
          setForm: vi.fn(),
          setError,
        }),
      { initialProps: { url: '' } }
    );
    rerender({ url: 'https://github.com/mallory/not-yours' });
    await act(async () => { await Promise.resolve(); });
    expect(setError).toHaveBeenCalledWith(expect.stringContaining('alice'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('merges incoming fields into form without clobbering existing values', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        project: {
          name: 'Imported Name',
          description: 'imported desc',
          website: 'https://imported.example',
          tags: ['a', 'b'],
          isOpenSource: true,
        },
      }),
    });

    let captured;
    const setForm = (updater) => {
      captured = typeof updater === 'function'
        ? updater({ name: 'Local', description: '', website: '', tags: '', isOpenSource: false })
        : updater;
    };

    const { rerender } = renderHook(
      ({ url }) =>
        useGithubImport({
          githubUrl: url,
          isEditMode: false,
          githubUsername: 'alice',
          setForm,
        }),
      { initialProps: { url: '' } }
    );

    rerender({ url: 'https://github.com/alice/repo' });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(captured.name).toBe('Local');
    expect(captured.description).toBe('imported desc');
    expect(captured.website).toBe('https://imported.example');
    expect(captured.tags).toBe('a, b');
    expect(captured.isOpenSource).toBe(true);
  });

  it('does not call setForm when the API returns a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    const setForm = vi.fn();
    const { rerender } = renderHook(
      ({ url }) =>
        useGithubImport({
          githubUrl: url,
          isEditMode: false,
          githubUsername: 'alice',
          setForm,
        }),
      { initialProps: { url: '' } }
    );
    rerender({ url: 'https://github.com/alice/repo' });
    await act(async () => { await Promise.resolve(); });
    expect(setForm).not.toHaveBeenCalled();
  });

  it('populates duplicateWarning after the 1.5s debounce', async () => {
    checkDuplicateGitHubUrl.mockResolvedValue({ id: 'existing', name: 'Existing' });

    const { result } = renderHook(() =>
      useGithubImport({
        githubUrl: 'https://github.com/alice/repo',
        isEditMode: false,
        setForm: vi.fn(),
      })
    );

    await waitFor(
      () => expect(result.current.duplicateWarning).toEqual({ id: 'existing', name: 'Existing' }),
      { timeout: 3000 }
    );
  });

  it('clears duplicateWarning when the URL is no longer a GitHub URL', () => {
    const { result, rerender } = renderHook(
      ({ url }) =>
        useGithubImport({ githubUrl: url, isEditMode: false, setForm: vi.fn() }),
      { initialProps: { url: 'https://github.com/a/b' } }
    );
    expect(result.current.duplicateWarning).toBeNull();
    rerender({ url: 'not a github url' });
    expect(result.current.duplicateWarning).toBeNull();
  });

  it('does not run duplicate check in edit mode', async () => {
    const { result } = renderHook(() =>
      useGithubImport({
        githubUrl: 'https://github.com/alice/repo',
        isEditMode: true,
        setForm: vi.fn(),
      })
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(checkDuplicateGitHubUrl).not.toHaveBeenCalled();
    expect(result.current.duplicateWarning).toBeNull();
  });
});
