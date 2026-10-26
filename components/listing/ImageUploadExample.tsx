"use client";

/**
 * Example integration of OptimizedImageUploader
 * This demonstrates how to use the image optimization pipeline in a listing form
 * Task: 21.2 - Image Optimization Pipeline
 */

import { useState } from "react";
import { OptimizedImageUploader, type UploadedImage } from "./OptimizedImageUploader";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ImageUploadExample() {
  const {
    images,
    isUploading,
    uploadError,
    addImages,
    removeImage,
    uploadToServer,
    clearImages,
    getImageUrls,
  } = useOptimizedImageUpload();

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleImagesChange = (newImages: UploadedImage[]) => {
    addImages(newImages);
  };

  const handleAutoUpload = async (imagesToUpload: UploadedImage[]) => {
    try {
      await uploadToServer(imagesToUpload);
    } catch (error) {
      console.error("Auto-upload failed:", error);
    }
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      alert("Please add at least one image");
      return;
    }

    try {
      // Get all uploaded image URLs
      const imageUrls = getImageUrls();

      // Here you would typically:
      // 1. Create the listing with imageUrls
      // 2. Save to database
      // 3. Show success message

      console.log("Image URLs ready for listing:", imageUrls);

      // Example structure of imageUrls:
      // [
      //   {
      //     thumbnail: "https://cdn.supabase.co/.../image1-thumbnail.webp",
      //     medium: "https://cdn.supabase.co/.../image1-medium.webp",
      //     large: "https://cdn.supabase.co/.../image1-large.webp"
      //   },
      //   { ... more images ... }
      // ]

      setSubmitStatus("success");
    } catch (error) {
      console.error("Submit failed:", error);
      setSubmitStatus("error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Create Listing with Optimized Images
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload images and they will be automatically optimized to WebP format
          in multiple sizes
        </p>
      </div>

      {/* Image Uploader */}
      <OptimizedImageUploader
        images={images}
        onImagesChange={handleImagesChange}
        onUpload={handleAutoUpload}
        maxImages={10}
      />

      {/* Upload Error */}
      {uploadError && (
        <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Upload Error
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">
                {uploadError}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Submit Status */}
      {submitStatus === "success" && (
        <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                Listing Created Successfully!
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                Your images have been optimized and uploaded to CDN.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Image Info */}
      {images.length > 0 && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 Optimization Summary
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • Total images: {images.length} (max 10)
            </li>
            <li>
              • Sizes per image: 3 (thumbnail, medium, large)
            </li>
            <li>
              • Format: WebP (optimized for web)
            </li>
            <li>
              • Storage: Supabase Storage with CDN
            </li>
            <li>
              • Upload status:{" "}
              {images.every((img) => img.uploadProgress === 100)
                ? "✅ All uploaded"
                : isUploading
                ? "⏳ Uploading..."
                : "⏸️ Ready to upload"}
            </li>
          </ul>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={
            images.length === 0 ||
            isUploading ||
            !images.every((img) => img.uploadProgress === 100)
          }
          className="flex-1"
        >
          {isUploading
            ? "Uploading..."
            : images.every((img) => img.uploadProgress === 100)
            ? "Create Listing"
            : "Optimize & Upload First"}
        </Button>
        <Button
          variant="outline"
          onClick={clearImages}
          disabled={images.length === 0 || isUploading}
        >
          Clear All
        </Button>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && images.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400">
            Debug: Image Data
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded overflow-auto max-h-64">
            {JSON.stringify(
              images.map((img) => ({
                id: img.id,
                originalName: img.originalFile.name,
                optimizedCount: img.optimizedImages.length,
                uploadProgress: img.uploadProgress,
                isUploading: img.isUploading,
                urls: img.uploadedUrls,
              })),
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
