"use client";

import { useState, useCallback } from "react";
import type { UploadedImage } from "@/components/listing/OptimizedImageUploader";

export interface UploadResult {
  success: boolean;
  urls: Record<string, string>;
  error?: string;
}

export interface UseOptimizedImageUploadReturn {
  images: UploadedImage[];
  isUploading: boolean;
  uploadError: string | null;
  addImages: (newImages: UploadedImage[]) => void;
  removeImage: (imageId: string) => void;
  uploadToServer: (images: UploadedImage[]) => Promise<void>;
  clearImages: () => void;
  getImageUrls: () => Record<string, string>[];
}

/**
 * Hook for managing optimized image uploads
 * Handles client-side optimization and server upload
 * Requirements: 26.4, 26.6, 26.7, 26.8, 26.10
 */
export function useOptimizedImageUpload(): UseOptimizedImageUploadReturn {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addImages = useCallback((newImages: UploadedImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
    setUploadError(null);
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  const uploadToServer = useCallback(async (imagesToUpload: UploadedImage[]) => {
    if (imagesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload each image set
      for (const image of imagesToUpload) {
        // Update image to show uploading state
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? { ...img, isUploading: true, uploadProgress: 0 }
              : img
          )
        );

        // Create FormData with all optimized sizes
        const formData = new FormData();
        
        image.optimizedImages.forEach((optimized) => {
          formData.append("files", optimized.file);
          formData.append("sizes", optimized.size);
        });
        
        formData.append("originalFileName", image.originalFile.name);

        // Upload to server with progress simulation
        const progressInterval = setInterval(() => {
          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id && img.uploadProgress < 90
                ? { ...img, uploadProgress: img.uploadProgress + 10 }
                : img
            )
          );
        }, 200);

        const response = await fetch("/api/listings/images/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const result: UploadResult = await response.json();

        // Update image with uploaded URLs
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  isUploading: false,
                  uploadProgress: 100,
                  uploadedUrls: result.urls,
                }
              : img
          )
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadError(errorMessage);

      // Mark failed images
      imagesToUpload.forEach((image) => {
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  isUploading: false,
                  error: errorMessage,
                }
              : img
          )
        );
      });

      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setUploadError(null);
  }, []);

  const getImageUrls = useCallback(() => {
    return images
      .filter((img) => img.uploadedUrls)
      .map((img) => img.uploadedUrls!);
  }, [images]);

  return {
    images,
    isUploading,
    uploadError,
    addImages,
    removeImage,
    uploadToServer,
    clearImages,
    getImageUrls,
  };
}

// Extend the UploadedImage type to include uploaded URLs
declare module "@/components/listing/OptimizedImageUploader" {
  interface UploadedImage {
    uploadedUrls?: Record<string, string>;
  }
}
