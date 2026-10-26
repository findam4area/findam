"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadMedia, generateVideoThumbnail, getVideoDuration } from "@/lib/api/listings";
import { compressImage, formatFileSize } from "@/lib/utils/client-image-compression";
import { Upload, X, Video, Image as ImageIcon, GripVertical } from "lucide-react";

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
  duration?: number;
  uploaded?: boolean;
  url?: string;
  error?: string;
}

interface MediaUploadProps {
  maxFiles?: number;
  maxVideoSize?: number; // in MB
  maxImageSize?: number; // in MB
  maxVideoDuration?: number; // in seconds
  onMediaChange?: (media: MediaFile[]) => void;
  initialMedia?: MediaFile[];
  className?: string;
}

export function MediaUpload({
  maxFiles = 10,
  maxVideoSize = 100,
  maxImageSize = 5,
  maxVideoDuration = 60,
  onMediaChange,
  initialMedia = [],
  className = "",
}: MediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(initialMedia);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = useCallback(
    (newMedia: MediaFile[]) => {
      setMediaFiles(newMedia);
      onMediaChange?.(newMedia);
    },
    [onMediaChange]
  );

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      return { valid: false, error: "Only images and videos are allowed" };
    }

    // Validate file size (before compression for images)
    const maxSize = isVideo ? maxVideoSize * 1024 * 1024 : maxImageSize * 1024 * 1024;
    
    // For images, we'll compress them, so we can be more lenient with initial size
    // For videos, enforce strict size limit
    if (isVideo && file.size > maxSize) {
      return {
        valid: false,
        error: `Video too large. Maximum size is ${maxVideoSize}MB`,
      };
    }

    // Validate image format (JPEG, PNG, WebP)
    if (isImage) {
      const validImageTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        return {
          valid: false,
          error: "Only JPEG, PNG, and WebP images are allowed",
        };
      }
    }

    // Validate video duration
    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > maxVideoDuration) {
          return {
            valid: false,
            error: `Video duration must be ${maxVideoDuration} seconds or less`,
          };
        }
      } catch (err) {
        return { valid: false, error: "Failed to validate video duration" };
      }
    }

    return { valid: true };
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Check total count
    if (mediaFiles.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} media files allowed`);
      return;
    }

    setError(null);

    // Process each file
    for (const file of fileArray) {
      const validation = await validateFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      let processedFile = file;
      let duration: number | undefined;

      // Compress images before upload
      if (!isVideo) {
        try {
          const compressionResult = await compressImage(file, {
            maxSizeMB: maxImageSize,
            maxWidthOrHeight: 1920,
            quality: 0.85,
          });
          processedFile = compressionResult.file;

          // Log compression stats
          console.log(
            `Compressed ${file.name}: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${Math.round((1 - compressionResult.compressionRatio) * 100)}% reduction)`
          );
        } catch (err) {
          console.error("Failed to compress image:", err);
          // Continue with original file if compression fails
        }
      } else {
        try {
          duration = await getVideoDuration(file);
        } catch (err) {
          console.error("Failed to get video duration:", err);
        }
      }

      const preview = await createPreview(processedFile);

      const mediaFile: MediaFile = {
        id: crypto.randomUUID(),
        file: processedFile,
        preview,
        type: isVideo ? "video" : "image",
        duration,
        uploaded: false,
      };

      handleMediaChange([...mediaFiles, mediaFile]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const removeMedia = (id: string) => {
    const newMedia = mediaFiles.filter((m) => m.id !== id);
    handleMediaChange(newMedia);
  };

  const handleReorder = (newOrder: MediaFile[]) => {
    handleMediaChange(newOrder);
  };

  const uploadFile = async (mediaFile: MediaFile) => {
    try {
      setUploadProgress((prev) => ({ ...prev, [mediaFile.id]: 0 }));

      // Upload the file
      const url = await uploadMedia(mediaFile.file);

      // Update media file with URL
      const updatedMedia = mediaFiles.map((m) =>
        m.id === mediaFile.id ? { ...m, uploaded: true, url } : m
      );
      handleMediaChange(updatedMedia);

      setUploadProgress((prev) => ({ ...prev, [mediaFile.id]: 100 }));
    } catch (err) {
      const updatedMedia = mediaFiles.map((m) =>
        m.id === mediaFile.id
          ? { ...m, error: err instanceof Error ? err.message : "Upload failed" }
          : m
      );
      handleMediaChange(updatedMedia);
    }
  };

  const uploadAll = async () => {
    const unuploadedFiles = mediaFiles.filter((m) => !m.uploaded && !m.error);
    await Promise.all(unuploadedFiles.map((m) => uploadFile(m)));
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-naija-green bg-naija-green/10"
            : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
          aria-label="Upload media files"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-lg"
        >
          <Upload className="w-12 h-12 mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Images (max {maxImageSize}MB) or Videos (max {maxVideoSize}MB, {maxVideoDuration}s)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Up to {maxFiles} files • Drag to reorder
          </p>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Media Preview Grid with Drag-and-Drop Reordering */}
      {mediaFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mediaFiles.length} / {maxFiles} files
            </p>
            {mediaFiles.some((m) => !m.uploaded) && (
              <Button
                type="button"
                size="sm"
                onClick={uploadAll}
                disabled={mediaFiles.every((m) => m.uploaded || m.error)}
              >
                Upload All
              </Button>
            )}
          </div>

          <Reorder.Group
            axis="y"
            values={mediaFiles}
            onReorder={handleReorder}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {mediaFiles.map((media, index) => (
                <Reorder.Item
                  key={media.id}
                  value={media}
                  className="relative group cursor-move"
                  whileDrag={{ scale: 1.05, zIndex: 10 }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                  >
                    {/* Media Preview */}
                    {media.type === "video" ? (
                      <div className="relative w-full h-full">
                        <video
                          src={media.preview}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        {media.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(media.duration)}s
                          </div>
                        )}
                      </div>
                    ) : (
                      <Image
                        src={media.preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}

                    {/* First Image Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-naija-green text-white text-xs px-2 py-1 rounded font-medium">
                        Cover
                      </div>
                    )}

                    {/* Upload Progress */}
                    {uploadProgress[media.id] !== undefined &&
                      uploadProgress[media.id] < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-3/4">
                            <Progress value={uploadProgress[media.id]} />
                          </div>
                        </div>
                      )}

                    {/* Error State */}
                    {media.error && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <p className="text-xs text-red-500 text-center px-2">
                          {media.error}
                        </p>
                      </div>
                    )}

                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeMedia(media.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      aria-label="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Upload Status */}
                    {media.uploaded && (
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        ✓ Uploaded
                      </div>
                    )}
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      )}
    </div>
  );
}
