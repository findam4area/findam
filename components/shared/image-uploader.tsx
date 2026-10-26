/**
 * Image Uploader Client Component with Drag-and-Drop
 * 
 * This component provides a comprehensive image upload interface with:
 * - Drag-and-drop zone with visual feedback
 * - File input button as fallback
 * - Support for 1-5 images with configurable limits
 * - Client-side validation (file type and size)
 * - Preview grid with thumbnails
 * - Upload progress indicators
 * - Sequential upload via Server Actions
 * - Error handling with retry option
 * - Image reordering via drag-and-drop
 * - Individual image deletion
 * - Mobile-optimized touch-friendly design
 * 
 * Requirements: 13.1, 13.3, 13.6, 13.7, 13.8, 13.9, 13.10, 13.14, 13.16
 * Task: 6.3 Create ImageUploader Client Component with drag-drop
 * 
 * @example
 * ```tsx
 * <ImageUploader
 *   onImagesUploaded={(urls) => setImageUrls(urls)}
 *   maxImages={5}
 *   bucket="listings"
 *   listingId={listingId}
 * />
 * ```
 */

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, X, RefreshCw, Loader2, GripVertical, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImageAction, deleteImageAction } from '@/lib/actions/image-actions';
import type { StorageBucket, ImageUploadState } from '@/lib/types/core';
import { cn } from '@/lib/utils';

// ============================================================================
// Helper: Extract Path from URL
// ============================================================================

/**
 * Extract storage path from public image URL
 * This helper is used to extract the path needed for deleteImageAction
 */
function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Expected format: /storage/v1/object/public/{bucket}/{path}
    const bucketIndex = pathParts.indexOf(bucket);
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null;
    }
    
    // Join path components after bucket name
    const relativePath = pathParts.slice(bucketIndex + 1).join('/');
    return relativePath || null;
  } catch {
    return null;
  }
}

// ============================================================================
// Component Props Interface
// ============================================================================

export interface ImageUploaderProps {
  /** Callback when images are successfully uploaded */
  onImagesUploaded: (urls: string[]) => void;
  
  /** Maximum number of images allowed (default: 5) */
  maxImages?: number;
  
  /** Maximum file size in MB per image (default: 5) */
  maxSizeMB?: number;
  
  /** Existing image URLs (for edit mode) */
  existingImages?: string[];
  
  /** Storage bucket to upload to */
  bucket: StorageBucket;
  
  /** Listing ID (required for listings bucket) */
  listingId?: string;
  
  /** Optional CSS class name */
  className?: string;
}

// ============================================================================
// Image Upload Component
// ============================================================================

export function ImageUploader({
  onImagesUploaded,
  maxImages = 5,
  maxSizeMB = 5,
  existingImages = [],
  bucket,
  listingId,
  className,
}: ImageUploaderProps) {
  // State management
  const [images, setImages] = useState<ImageUploadState[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingImages);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate remaining slots
  const remainingSlots = maxImages - uploadedUrls.length;
  const canUploadMore = remainingSlots > 0;

  // ============================================================================
  // File Validation
  // ============================================================================

  /**
   * Validate a single file
   * Requirement 13.4: Validate file type (JPEG/PNG/WebP)
   * Requirement 13.5: Validate file size (5MB max per image)
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      };
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB.`,
      };
    }

    return { valid: true };
  };

  // ============================================================================
  // Drag and Drop Handlers
  // ============================================================================

  /**
   * Handle drag over event
   * Requirement 13.3: Visual feedback (border highlight on dragover)
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  /**
   * Handle file drop
   * Requirement 13.3: Drag-and-drop zone
   */
  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  // ============================================================================
  // File Selection Handler
  // ============================================================================

  /**
   * Handle file selection from input
   * Requirement 13.3: File input button as fallback
   */
  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  // ============================================================================
  // File Processing
  // ============================================================================

  /**
   * Process selected files
   * Requirement 13.3: Support selecting 1-5 images at once (enforce maxImages limit)
   * Requirement 13.6: Display preview grid showing thumbnails
   */
  const handleFiles = async (files: File[]) => {
    // Limit to remaining slots
    const filesToUpload = files.slice(0, remainingSlots);

    // Validate each file
    const validatedFiles: { file: File; index: number }[] = [];
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const validation = validateFile(file);

      if (validation.valid) {
        validatedFiles.push({ file, index: images.length + i });
      } else {
        // Show validation error immediately
        const errorState: ImageUploadState = {
          file,
          preview: '',
          uploading: false,
          progress: 0,
          error: validation.error,
        };
        setImages((prev) => [...prev, errorState]);
      }
    }

    // Create preview states for valid files
    const newImages: ImageUploadState[] = validatedFiles.map(({ file }) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      progress: 0,
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Upload valid files sequentially
    // Requirement 13.7: Upload images sequentially via uploadImageAction
    for (const { file, index } of validatedFiles) {
      await uploadSingleImage(index, file);
    }
  };

  // ============================================================================
  // Single Image Upload
  // ============================================================================

  /**
   * Upload a single image
   * Requirement 13.7: Show upload progress bar for each image (0-100%)
   * Requirement 13.7: Upload via uploadImageAction Server Action
   * Requirement 13.8: Display upload errors inline per image
   */
  const uploadSingleImage = async (index: number, file: File) => {
    // Update state to uploading
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], uploading: true, progress: 0 };
      return updated;
    });

    // Simulate progress (since we don't have real-time progress from Server Actions)
    const progressInterval = setInterval(() => {
      setImages((prev) => {
        const updated = [...prev];
        if (updated[index] && updated[index].uploading && updated[index].progress < 90) {
          updated[index] = { ...updated[index], progress: updated[index].progress + 10 };
        }
        return updated;
      });
    }, 200);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      if (listingId) {
        formData.append('listingId', listingId);
      }
      
      formData.append('index', String(uploadedUrls.length + 1));

      // Upload via Server Action
      const result = await uploadImageAction(formData, bucket);

      clearInterval(progressInterval);

      if (result.success && result.result) {
        // Update with URL
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            uploading: false,
            progress: 100,
            url: result.result!.url,
            error: undefined,
          };
          return updated;
        });

        // Add to uploaded URLs
        const newUrls = [...uploadedUrls, result.result.url];
        setUploadedUrls(newUrls);
        onImagesUploaded(newUrls);
      } else {
        // Handle error
        // Requirement 13.8: Display upload errors inline per image
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            uploading: false,
            progress: 0,
            error: result.error || 'Upload failed',
          };
          return updated;
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          uploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
        };
        return updated;
      });
    }
  };

  // ============================================================================
  // Retry Upload
  // ============================================================================

  /**
   * Retry failed upload
   * Requirement 13.8: Retry option for failed uploads
   */
  const handleRetry = async (index: number) => {
    const image = images[index];
    if (image && image.file) {
      await uploadSingleImage(index, image.file);
    }
  };

  // ============================================================================
  // Image Deletion
  // ============================================================================

  /**
   * Remove an image
   * Requirement 13.10: Allow removing individual images
   * Requirement 13.10: Delete from storage via deleteImageAction
   */
  const handleRemove = async (urlIndex: number) => {
    const url = uploadedUrls[urlIndex];
    
    if (url) {
      // Extract path from URL for deletion
      const path = extractPathFromUrl(url, bucket);
      
      if (path) {
        // Delete from storage
        await deleteImageAction(path, bucket);
      }
    }
    
    // Update state
    const newUrls = uploadedUrls.filter((_, i) => i !== urlIndex);
    setUploadedUrls(newUrls);
    onImagesUploaded(newUrls);
    
    // Clean up corresponding image state
    setImages((prev) => {
      const uploaded = prev.filter((img) => img.url);
      const urlIndexInImages = uploaded.findIndex((img) => img.url === url);
      if (urlIndexInImages !== -1) {
        const actualIndex = prev.findIndex((img) => img.url === url);
        return prev.filter((_, i) => i !== actualIndex);
      }
      return prev;
    });
  };

  // ============================================================================
  // Image Reordering
  // ============================================================================

  /**
   * Handle reordering images via drag-and-drop
   * Requirement 13.9: Allow reordering images via drag-drop
   * Requirement 13.9: First image = primary
   */
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder URLs
    const newUrls = [...uploadedUrls];
    const [movedUrl] = newUrls.splice(draggedIndex, 1);
    newUrls.splice(targetIndex, 0, movedUrl);

    setUploadedUrls(newUrls);
    onImagesUploaded(newUrls);
    setDraggedIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Drag-and-Drop Zone */}
      {/* Requirement 13.3: Drag-and-drop zone with visual feedback */}
      {canUploadMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            'min-h-[200px] touch-manipulation', // Requirement 13.16: Mobile-optimized
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:bg-muted/50'
          )}
        >
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Upload Images</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Drag and drop images here, or click to select
          </p>
          <p className="mb-4 text-center text-xs text-muted-foreground">
            {remainingSlots} of {maxImages} images remaining • Max {maxSizeMB}MB per image
          </p>
          
          {/* File Input Button */}
          {/* Requirement 13.3: File input button as fallback */}
          <Button
            type="button"
            onClick={handleSelectFiles}
            variant="outline"
            className="min-h-[44px]" // Requirement 13.16: Touch-friendly (44px minimum)
          >
            <Upload className="mr-2 h-4 w-4" />
            Select Images
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <p className="mt-4 text-xs text-muted-foreground">
            Supported formats: JPEG, PNG, WebP
          </p>
        </div>
      )}

      {/* Upload Progress and Preview Grid */}
      {/* Requirement 13.6: Display preview grid showing thumbnails */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Uploading Images</h4>
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                {/* Preview Thumbnail */}
                {image.preview && (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={image.preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* File Info and Progress */}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium truncate">
                    {image.file.name}
                  </p>
                  
                  {/* Progress Bar */}
                  {/* Requirement 13.7: Show upload progress bar (0-100%) */}
                  {image.uploading && (
                    <div className="space-y-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${image.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Uploading... {image.progress}%
                      </p>
                    </div>
                  )}

                  {/* Success State */}
                  {image.url && !image.uploading && (
                    <p className="text-xs text-green-600">
                      ✓ Upload complete
                    </p>
                  )}

                  {/* Error State */}
                  {/* Requirement 13.8: Display upload errors inline per image */}
                  {image.error && (
                    <p className="text-xs text-destructive">
                      {image.error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {image.uploading && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  
                  {/* Retry Button */}
                  {/* Requirement 13.8: Retry option for failed uploads */}
                  {image.error && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRetry(index)}
                      className="h-9 w-9"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images Grid with Reordering */}
      {/* Requirement 13.9: Allow reordering images via drag-drop */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Uploaded Images ({uploadedUrls.length})
            {uploadedUrls.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                • First image is primary
              </span>
            )}
          </h4>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {uploadedUrls.map((url, index) => (
              <div
                key={url}
                draggable
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={handleImageDragOver}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
                className={cn(
                  'group relative aspect-square cursor-move overflow-hidden rounded-lg border-2 bg-muted',
                  'transition-all hover:border-primary',
                  draggedIndex === index && 'opacity-50',
                  index === 0 && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {/* Image */}
                <Image
                  src={url}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    Primary
                  </div>
                )}

                {/* Drag Handle */}
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="rounded bg-black/50 p-1">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Remove Button */}
                {/* Requirement 13.10: Allow removing individual images */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className={cn(
                    'absolute right-2 bottom-2 rounded-full bg-destructive p-1.5',
                    'opacity-0 transition-opacity group-hover:opacity-100',
                    'hover:bg-destructive/90 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive',
                    'min-h-[44px] min-w-[44px] flex items-center justify-center' // Requirement 13.16: Touch-friendly
                  )}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4 text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {uploadedUrls.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag images to reorder. The first image will be used as the primary thumbnail.
        </p>
      )}
    </div>
  );
}
