"use client";

import { useState } from "react";
import { MediaUpload, type MediaFile } from "./media-upload";
import { ImageGallery, type GalleryMedia } from "./image-gallery";
import { Button } from "@/components/ui/button";

/**
 * Demo component showcasing MediaUpload and ImageGallery components
 * This demonstrates the complete flow from upload to gallery display
 */
export function MediaGalleryDemo() {
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const [showGallery, setShowGallery] = useState(false);

  // Convert MediaFile[] to GalleryMedia[] for the gallery component
  const galleryMedia: GalleryMedia[] = uploadedMedia
    .filter((m) => m.uploaded && m.url)
    .map((m) => ({
      id: m.id,
      url: m.url!,
      type: m.type,
      duration: m.duration,
      thumbnail: m.type === "video" ? m.preview : undefined,
    }));

  const handleMediaChange = (media: MediaFile[]) => {
    setUploadedMedia(media);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Media Upload & Gallery Demo</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload images and videos, then view them in an interactive gallery with lightbox
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Upload Media</h2>
        <MediaUpload
          maxFiles={10}
          maxVideoSize={100}
          maxImageSize={5}
          maxVideoDuration={60}
          onMediaChange={handleMediaChange}
          initialMedia={uploadedMedia}
        />
      </div>

      {/* Gallery Section */}
      {galleryMedia.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">2. View Gallery</h2>
            <Button onClick={() => setShowGallery(!showGallery)}>
              {showGallery ? "Hide Gallery" : "Show Gallery"}
            </Button>
          </div>

          {showGallery && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <ImageGallery media={galleryMedia} />
            </div>
          )}
        </div>
      )}

      {/* Features List */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">MediaUpload Component:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Drag-and-drop file upload</li>
              <li>✓ Support for up to 10 images/videos</li>
              <li>✓ Video duration validation (60s max)</li>
              <li>✓ File size validation (5MB images, 100MB videos)</li>
              <li>✓ Drag-to-reorder media files</li>
              <li>✓ Upload progress indicators</li>
              <li>✓ Preview thumbnails</li>
              <li>✓ Individual file removal</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">ImageGallery Component:</h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Thumbnail navigation</li>
              <li>✓ Full-screen lightbox view</li>
              <li>✓ Keyboard navigation (arrows, ESC)</li>
              <li>✓ Video playback support</li>
              <li>✓ Responsive design</li>
              <li>✓ Smooth animations</li>
              <li>✓ Touch-friendly controls</li>
              <li>✓ Media counter display</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Requirements Validation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Requirements Validation</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>26.1:</strong> Support uploading up to 10 images per listing
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>26.2:</strong> Support video uploads (60s max, 100MB max)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>26.3:</strong> Implement image gallery with thumbnail navigation and lightbox
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>
              <strong>26.5:</strong> Support drag-and-drop reordering of gallery images
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
