/**
 * ProjectGallery — image/video gallery with lightbox
 *
 * Shows the primary imageUrl as a large hero. Additional media items
 * render as a thumbnail strip below. Click opens a fullscreen lightbox.
 * Video items show a play overlay and open inline.
 */

import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg)$/i.test(url)
    || /youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\//i.test(url)
    || /loom\.com\/share\//i.test(url)
    || /vimeo\.com\//i.test(url);
}

function getVideoEmbedUrl(url) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const loomMatch = url.match(/loom\.com\/share\/([\w-]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return url;
}

function getVideoThumbnail(url) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

export default function ProjectGallery({ imageUrl, media }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Combine primary image with gallery media into a single list
  const allMedia = useMemo(() => {
    const items = [];
    if (imageUrl) items.push({ url: imageUrl, type: 'image', caption: '', isPrimary: true });
    if (Array.isArray(media)) {
      for (const item of media) {
        const type = item.type === 'video' || isVideoUrl(item.url) ? 'video' : 'image';
        items.push({ url: item.url, type, caption: item.caption || '' });
      }
    }
    return items;
  }, [imageUrl, media]);

  if (allMedia.length === 0) return null;

  const primary = allMedia[0];
  const rest = allMedia.slice(1);

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setLightboxIndex((i) => (i > 0 ? i - 1 : allMedia.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setLightboxIndex((i) => (i < allMedia.length - 1 ? i + 1 : 0));
  };

  return (
    <>
      {/* Hero image */}
      <div
        className="relative aspect-[16/7] w-full overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer group"
        onClick={() => openLightbox(0)}
      >
        {primary.type === 'video' ? (
          <iframe
            src={getVideoEmbedUrl(primary.url)}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Project video"
          />
        ) : (
          <>
            <img src={primary.url} alt="Project" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </>
        )}

        {/* Image count badge */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            1/{allMedia.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {rest.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mt-1 px-1">
          {allMedia.map((item, idx) => (
            <button
              key={idx}
              onClick={() => openLightbox(idx)}
              className={`relative flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === 0 ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  {getVideoThumbnail(item.url) ? (
                    <img src={getVideoThumbnail(item.url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PlayIcon className="w-5 h-5 text-white/70" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                      <PlayIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {allMedia.length}
          </div>

          {/* Prev / Next */}
          {allMedia.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Media */}
          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {allMedia[lightboxIndex]?.type === 'video' ? (
              <iframe
                src={getVideoEmbedUrl(allMedia[lightboxIndex].url)}
                className="w-[80vw] h-[45vw] max-w-4xl max-h-[80vh]"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Video"
              />
            ) : (
              <img
                src={allMedia[lightboxIndex]?.url}
                alt=""
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}

            {allMedia[lightboxIndex]?.caption && (
              <p className="text-white/70 text-sm text-center mt-3">
                {allMedia[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
