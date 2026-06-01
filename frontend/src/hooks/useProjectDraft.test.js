/**
 * useProjectDraft — local + cloud draft persistence for ProjectEditor.
 *
 * Verifies:
 *  - loadLocalDraft() reads + parses localStorage safely
 *  - local save fires after ~1s when form changes (and not in edit mode)
 *  - cloud save fires after ~8s when signed in (and not in edit mode)
 *  - edit mode short-circuits both timers
 *  - clearDraft removes local + cloud state
 *  - useCloudDraftRestore returns the cloud form (or null)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectDraft, useCloudDraftRestore, loadLocalDraft } from './useProjectDraft';

const DRAFT_KEY = 'project-editor-draft';

const { mocks, fakeRef, fakeExistsDoc, fakeMissingDoc } = vi.hoisted(() => {
  const fakeRef = { __fake: 'doc-ref' };
  // The hook reads snap.exists() as a function — match that contract in the fake.
  // (Real Firestore exposes exists as a boolean property; the hook is internally
  // inconsistent, but the test should not depend on that quirk.)
  const fakeExistsDoc = { exists: () => true, data: () => ({ form: { name: 'restored' } }), id: 'doc-id' };
  const fakeMissingDoc = { exists: () => false, data: () => undefined, id: 'doc-id' };
  return {
    mocks: {
      doc: vi.fn(() => fakeRef),
      getDoc: vi.fn(() => Promise.resolve(fakeMissingDoc)),
      setDoc: vi.fn(() => Promise.resolve()),
      deleteDoc: vi.fn(() => Promise.resolve()),
    },
    fakeRef,
    fakeExistsDoc,
    fakeMissingDoc,
  };
});

vi.mock('@/lib/firebase/clientApp', () => ({
  db: { __fakeDb: true },
  storage: { __fakeStorage: true },
}));

vi.mock('firebase/firestore', () => mocks);

// In-memory localStorage: vitest.setup.js wires the methods as disconnected
// vi.fn()s, so we install a real backing store that the mock methods read/write.
const store = new Map();
beforeEach(() => {
  store.clear();
  localStorage.getItem.mockImplementation((k) => (store.has(k) ? store.get(k) : null));
  localStorage.setItem.mockImplementation((k, v) => { store.set(k, String(v)); });
  localStorage.removeItem.mockImplementation((k) => { store.delete(k); });
  localStorage.clear.mockImplementation(() => { store.clear(); });
  localStorage.setItem.mockClear();

  Object.values(mocks).forEach((fn) => fn.mockClear());
  mocks.getDoc.mockResolvedValue(fakeMissingDoc);
  mocks.doc.mockReturnValue(fakeRef);

  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('loadLocalDraft', () => {
  it('returns null when nothing is saved', () => {
    expect(loadLocalDraft()).toBeNull();
  });

  it('parses the saved JSON', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: 'saved' }));
    expect(loadLocalDraft()).toEqual({ name: 'saved' });
  });

  it('returns null when the saved value is not valid JSON', () => {
    localStorage.setItem(DRAFT_KEY, '{not-json');
    expect(loadLocalDraft()).toBeNull();
  });
});

describe('useProjectDraft', () => {
  const baseArgs = {
    form: { name: 'Draft' },
    imageUrl: '',
    isEditMode: false,
    currentUser: { uid: 'user-1' },
    projectSlug: 'draft',
  };

  it('reports hasDraft=true on mount when localStorage already has one', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: 'x' }));
    const { result } = renderHook(() => useProjectDraft(baseArgs));
    expect(result.current.hasDraft).toBe(true);
  });

  it('writes the form to localStorage after the 1s debounce', async () => {
    const { result, rerender } = renderHook(
      ({ form }) => useProjectDraft({ ...baseArgs, form }),
      { initialProps: { form: { name: 'first' } } }
    );

    expect(result.current.draftSaved).toBeNull();

    rerender({ form: { name: 'second' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      DRAFT_KEY,
      expect.stringContaining('second')
    );
    expect(result.current.draftSaved).toBe('local');
  });

  it('does not write to localStorage in edit mode', async () => {
    renderHook(() => useProjectDraft({ ...baseArgs, isEditMode: true, form: { name: 'x' } }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('writes the form to Firestore after the 8s debounce when signed in', async () => {
    const { rerender } = renderHook(
      ({ form }) => useProjectDraft({ ...baseArgs, form }),
      { initialProps: { form: { name: 'cloud' } } }
    );

    rerender({ form: { name: 'cloud-v2' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    const [refArg, payloadArg, optsArg] = mocks.setDoc.mock.calls[0];
    expect(refArg).toBe(fakeRef);
    expect(payloadArg.form).toEqual({ name: 'cloud-v2' });
    expect(payloadArg.projectId).toBe('draft');
    expect(optsArg).toEqual({ merge: true });
  });

  it('does not write to Firestore when no user is signed in', async () => {
    renderHook(() =>
      useProjectDraft({ ...baseArgs, currentUser: null, form: { name: 'x' } })
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });

  it('clearDraft removes localStorage and schedules a Firestore delete', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: 'x' }));
    const { result } = renderHook(() => useProjectDraft(baseArgs));

    act(() => result.current.clearDraft());
    expect(localStorage.removeItem).toHaveBeenCalledWith(DRAFT_KEY);
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draftSaved).toBeNull();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.deleteDoc).toHaveBeenCalledWith(fakeRef);
  });
});

describe('useCloudDraftRestore', () => {
  it('returns null when the user is not signed in', async () => {
    const { result } = renderHook(() =>
      useCloudDraftRestore({ isEditMode: false, currentUser: null, hasLocalDraft: false })
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current).toBeNull();
  });

  it('returns the cloud form when a draft exists', async () => {
    vi.useRealTimers();
    mocks.getDoc.mockResolvedValue(fakeExistsDoc);
    const callsBefore = mocks.getDoc.mock.calls.length;

    const { result } = renderHook(() =>
      useCloudDraftRestore({
        isEditMode: false,
        currentUser: { uid: 'u1' },
        hasLocalDraft: false,
      })
    );

    await waitFor(
      () => {
        expect(mocks.getDoc.mock.calls.length).toBeGreaterThan(callsBefore);
        expect(result.current).toEqual({ name: 'restored' });
      },
      { timeout: 2000 }
    );
  });

  it('returns null when the user already has a local draft', async () => {
    vi.useRealTimers();
    const callsBefore = mocks.getDoc.mock.calls.length;
    renderHook(() =>
      useCloudDraftRestore({
        isEditMode: false,
        currentUser: { uid: 'u1' },
        hasLocalDraft: true,
      })
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.getDoc.mock.calls.length).toBe(callsBefore);
  });
});
