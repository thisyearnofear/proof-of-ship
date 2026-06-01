/**
 * useProjectImage — hero image + gallery media state and upload handlers.
 *
 * Hero image is resized client-side to 1200x630 (OG standard) and uploaded
 * to Firebase Storage. Gallery accepts multiple images (max 5MB each) and
 * video URLs (YouTube, Loom, Vimeo) added via prompt.
 */

import { useState } from "react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/clientApp";

const MAX_HERO_BYTES = 2 * 1024 * 1024;
const MAX_GALLERY_BYTES = 5 * 1024 * 1024;
const HERO_W = 1200;
const HERO_H = 630;
const HERO_QUALITY = 0.85;

async function fileToImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function resizeToHero(file) {
  const img = await fileToImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = HERO_W;
  canvas.height = HERO_H;
  const ctx = canvas.getContext("2d");
  const scale = Math.max(HERO_W / img.width, HERO_H / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (HERO_W - w) / 2, (HERO_H - h) / 2, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", HERO_QUALITY));
}

export function useProjectImage({ projectSlug, currentUser, initialHero = "", initialGallery = [] }) {
  const [imageUrl, setImageUrl] = useState(initialHero);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [galleryMedia, setGalleryMedia] = useState(initialGallery);

  const uploadBlobToStorage = async (blob, filename) => {
    const slug = projectSlug || `temp-${currentUser?.uid || "anonymous"}`;
    const path = `projects/${slug}/${filename}`;
    const ref = storageRef(storage, path);
    const snapshot = await uploadBytes(ref, blob, { contentType: blob.type || "image/jpeg" });
    return getDownloadURL(snapshot.ref);
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file");
      return;
    }
    if (file.size > MAX_HERO_BYTES) {
      setImageError("Image must be under 2MB");
      return;
    }

    setUploadingImage(true);
    try {
      const blob = await resizeToHero(file);
      if (!blob) throw new Error("Failed to process image");
      const url = await uploadBlobToStorage(blob, `${Date.now()}.jpg`);
      setImageUrl(url);
    } catch (err) {
      console.error("Image upload failed:", err);
      setImageError(`Upload failed: ${err.message || "Please try again."}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImage(true);
    setImageError(null);

    const uploaded = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_GALLERY_BYTES) {
        setImageError(`"${file.name}" is too large (max 5MB)`);
        continue;
      }
      try {
        const slug = projectSlug || `temp-${currentUser?.uid || "anon"}`;
        const path = `projects/${slug}/gallery/${Date.now() + Math.random()}-${file.name}`;
        const ref = storageRef(storage, path);
        const snapshot = await uploadBytes(ref, file, { contentType: file.type });
        const url = await getDownloadURL(snapshot.ref);
        uploaded.push({ url, type: "image", caption: "" });
      } catch (err) {
        console.error("Gallery upload failed:", err);
        setImageError(`Failed to upload ${file.name}`);
      }
    }

    if (uploaded.length) {
      setGalleryMedia((prev) => [...prev, ...uploaded]);
    }
    setUploadingImage(false);
  };

  const handleAddVideoUrl = () => {
    const url = prompt("Paste a video URL (YouTube, Loom, Vimeo):");
    if (!url || !url.trim()) return;
    setGalleryMedia((prev) => [...prev, { url: url.trim(), type: "video", caption: "" }]);
  };

  const handleRemoveMedia = (idx) => {
    setGalleryMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMediaCaption = (idx, caption) => {
    setGalleryMedia((prev) => prev.map((m, i) => (i === idx ? { ...m, caption } : m)));
  };

  return {
    imageUrl,
    setImageUrl,
    uploadingImage,
    imageError,
    galleryMedia,
    setGalleryMedia,
    handleHeroUpload,
    handleGalleryUpload,
    handleAddVideoUrl,
    handleRemoveMedia,
    handleUpdateMediaCaption,
  };
}
