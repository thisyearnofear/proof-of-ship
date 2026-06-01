/**
 * useProjectImage — hero image + gallery media state for ProjectEditor.
 *
 * Verifies:
 *  - initial state from props (imageUrl, gallery)
 *  - hero upload validation: rejects non-image, rejects > 2MB
 *  - gallery upload validation: skips non-image, skips > 5MB
 *  - handleAddVideoUrl adds video entries via prompt
 *  - handleRemoveMedia / handleUpdateMediaCaption mutate gallery
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { fakeRef, uploadBytes, getDownloadURL, storageRef } = vi.hoisted(() => {
  const fakeRef = { __fake: 'storage-ref' };
  return {
    fakeRef,
    uploadBytes: vi.fn(async () => ({ ref: fakeRef })),
    getDownloadURL: vi.fn(async () => 'https://fake-cdn.example/uploaded.png'),
    storageRef: vi.fn(() => fakeRef),
  };
});

vi.mock('firebase/storage', () => ({
  ref: storageRef,
  uploadBytes,
  getDownloadURL,
}));

vi.mock('@/lib/firebase/clientApp', () => ({
  storage: { __fake: 'storage-instance' },
  db: { __fake: 'db-instance' },
}));

import { useProjectImage } from './useProjectImage';

const fakeFile = (name, sizeBytes, type) => {
  const file = new File([new Uint8Array(sizeBytes)], name, { type });
  return file;
};

beforeEach(() => {
  uploadBytes.mockClear();
  getDownloadURL.mockClear();
  storageRef.mockClear();
  storageRef.mockReturnValue(fakeRef);
  getDownloadURL.mockResolvedValue('https://fake-cdn.example/uploaded.png');
  uploadBytes.mockResolvedValue({ ref: fakeRef });
});

describe('useProjectImage', () => {
  it('seeds state from initial props', () => {
    const { result } = renderHook(() =>
      useProjectImage({
        projectSlug: 'cool-project',
        currentUser: { uid: 'u1' },
        initialHero: 'https://example.com/hero.jpg',
        initialGallery: [{ url: 'a', type: 'image', caption: 'a' }],
      })
    );
    expect(result.current.imageUrl).toBe('https://example.com/hero.jpg');
    expect(result.current.galleryMedia).toHaveLength(1);
    expect(result.current.uploadingImage).toBe(false);
    expect(result.current.imageError).toBeNull();
  });

  it('hero upload rejects a non-image file', async () => {
    const { result } = renderHook(() =>
      useProjectImage({ projectSlug: 'p', currentUser: { uid: 'u' } })
    );
    const pdf = fakeFile('a.pdf', 1000, 'application/pdf');
    await act(async () => {
      await result.current.handleHeroUpload({ target: { files: [pdf] } });
    });
    expect(result.current.imageError).toMatch(/image file/i);
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('hero upload rejects a file over 2MB', async () => {
    const { result } = renderHook(() =>
      useProjectImage({ projectSlug: 'p', currentUser: { uid: 'u' } })
    );
    const big = fakeFile('big.jpg', 3 * 1024 * 1024, 'image/jpeg');
    await act(async () => {
      await result.current.handleHeroUpload({ target: { files: [big] } });
    });
    expect(result.current.imageError).toMatch(/2MB/);
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('handleAddVideoUrl adds a video entry from the prompt', () => {
    vi.spyOn(window, 'prompt').mockReturnValue('https://youtube.com/watch?v=abc');
    const { result } = renderHook(() =>
      useProjectImage({ projectSlug: 'p', currentUser: { uid: 'u' } })
    );
    act(() => result.current.handleAddVideoUrl());
    expect(result.current.galleryMedia).toEqual([
      { url: 'https://youtube.com/watch?v=abc', type: 'video', caption: '' },
    ]);
    window.prompt.mockRestore();
  });

  it('handleAddVideoUrl is a no-op for an empty prompt', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const { result } = renderHook(() =>
      useProjectImage({ projectSlug: 'p', currentUser: { uid: 'u' } })
    );
    act(() => result.current.handleAddVideoUrl());
    expect(result.current.galleryMedia).toEqual([]);
    window.prompt.mockRestore();
  });

  it('handleRemoveMedia removes the entry at the given index', () => {
    const { result } = renderHook(() =>
      useProjectImage({
        projectSlug: 'p',
        currentUser: { uid: 'u' },
        initialGallery: [
          { url: 'a', type: 'image', caption: 'a' },
          { url: 'b', type: 'image', caption: 'b' },
          { url: 'c', type: 'image', caption: 'c' },
        ],
      })
    );
    act(() => result.current.handleRemoveMedia(1));
    expect(result.current.galleryMedia.map((m) => m.url)).toEqual(['a', 'c']);
  });

  it('handleUpdateMediaCaption updates only the targeted index', () => {
    const { result } = renderHook(() =>
      useProjectImage({
        projectSlug: 'p',
        currentUser: { uid: 'u' },
        initialGallery: [
          { url: 'a', type: 'image', caption: 'a' },
          { url: 'b', type: 'image', caption: 'b' },
        ],
      })
    );
    act(() => result.current.handleUpdateMediaCaption(0, 'new caption'));
    expect(result.current.galleryMedia[0].caption).toBe('new caption');
    expect(result.current.galleryMedia[1].caption).toBe('b');
  });

  it('gallery upload skips non-image files', async () => {
    const { result } = renderHook(() =>
      useProjectImage({ projectSlug: 'p', currentUser: { uid: 'u' } })
    );
    const pdf = fakeFile('a.pdf', 100, 'application/pdf');
    await act(async () => {
      await result.current.handleGalleryUpload({ target: { files: [pdf] } });
    });
    expect(uploadBytes).not.toHaveBeenCalled();
    expect(result.current.galleryMedia).toEqual([]);
  });

  it('gallery upload flags files over 5MB with a per-file error', async () => {
    const { result } = renderHook(() =>
      useProjectImage({ projectSlug: 'p', currentUser: { uid: 'u' } })
    );
    const big = fakeFile('big.jpg', 6 * 1024 * 1024, 'image/jpeg');
    await act(async () => {
      await result.current.handleGalleryUpload({ target: { files: [big] } });
    });
    expect(uploadBytes).not.toHaveBeenCalled();
    expect(result.current.imageError).toMatch(/too large/);
    expect(result.current.imageError).toMatch(/5MB/);
  });
});
