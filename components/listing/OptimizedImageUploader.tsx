"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  optimizeImage,
  validateImage,
  cleanupObjectUrls,
  calculateTotalProgress,
  getProgressMessage,
  MAX_IMAGES_PER_LISTING,
  type OptimizedImage,
  type ImageOptimizationProgress,
} from "@/lib/utils/image-optimization";

export interface UploadedImage {
  id: string;
  originalFile: File;
  optimizedImages: OptimizedImage[];
  thumbnailUrl: string;
  uploadProgress: number;
  isUploading: boolean;
  error?: string;
}

interface OptimizedImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onUpload?: (images: UploadedImage[]) => Promise<void>;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

export function OptimizedImageUploader({
  images,
  onImagesChange,
  onUpload,
  maxImages = MAX_IMAGES_PER_LISTING,
  disabled = false,
  className,
}: OptimizedImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<
    Map<string, ImageOptimizationProgress>
  >(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];

      // Check total count
      if (images.length + files.length > maxImages) {
        errors.push(
          `Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`
        );
        return { valid: [], errors };
      }

      for (const file of files) {
        const validation = validateImage(file);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }
        valid.push(file);
      }

      return { valid, errors };
    },
    [images.length, maxImages]
  );

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || disabled || isProcessing) return;

    const fileArray = Array.from(files);
    const { valid, errors: validationErrors } = validateFiles(fileArray);

    setErrors(validationErrors);

    if (valid.length === 0) return;

    setIsProcessing(true);

    try {
      const newImages: UploadedImage[] = [];

      // Process each file
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const imageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Optimize image with progress tracking
        const optimized = await optimizeImage(file, (progress) => {
          setProcessingProgress((prev) => {
            const updated = new Map(prev);
            updated.set(file.name, progress);
            return updated;
          });
        });

        // Find thumbnail for preview
        const thumbnail = optimized.find((img) => img.size === "thumbnail");

        newImages.push({
          id: imageId,
          originalFile: file,
          optimizedImages: optimized,
          thumbnailUrl: thumbnail?.url || optimized[0].url,
          uploadProgress: 0,
          isUploading: false,
        });

        // Clear progress for this file
        setProcessingProgress((prev) => {
          const updated = new Map(prev);
          updated.delete(file.name);
          return updated;
        });
      }

      // Add to images list
      onImagesChange([...images, ...newImages]);
      setErrors([]);

      // Trigger upload if callback provided
      if (onUpload) {
        await onUpload(newImages);
      }
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Failed to process images",
      ]);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isProcessing) {
        setIsDragging(true);
      }
    },
    [disabled, isProcessing]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isProcessing) return;

      const files = e.dataTransfer.files;
      await handleFileSelect(files);
    },
    [disabled, isProcessing, handleFileSelect]
  );

  const handleRemove = useCallback(
    (imageId: string) => {
      if (disabled) return;

      const imageToRemove = images.find((img) => img.id === imageId);
      if (imageToRemove) {
        // Cleanup object URLs
        const urls = imageToRemove.optimizedImages.map((img) => img.url);
        cleanupObjectUrls(urls);
      }

      onImagesChange(images.filter((img) => img.id !== imageId));
    },
    [disabled, images, onImagesChange]
  );

  // Calculate total processing progress
  const totalProgress = Array.from(processingProgress.values()).reduce(
    (sum, progress) => sum + progress.percentage,
    0
  ) / Math.max(processingProgress.size, 1);

  const currentProcessingMessage =
    processingProgress.size > 0
      ? getProgressMessage(
          processingProgress.size,
          processingProgress.size,
          Array.from(processingProgress.values())[0]?.currentStep || ""
        )
      : "";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "relative border-2 border-dashed transition-all",
          isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950",
          (disabled || isProcessing) && "opacity-50 cursor-not-allowed",
          !disabled && !isProcessing && "cursor-pointer hover:border-blue-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && !isProcessing && fileInputRef.current?.click()
        }
      >
        <div className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || isProcessing}
          />

          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isDragging ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {isProcessing ? (
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            )}
          </motion.div>

          <h3 className="text-lg font-semibold mb-2">
            {isProcessing ? "Processing Images..." : "Upload Images"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {isProcessing
              ? currentProcessingMessage
              : "Drag and drop images here, or click to select files"}
          </p>
          <p className="text-xs text-gray-500">
            {images.length} / {maxImages} images • Auto-optimized to WebP •
            JPEG, PNG, WebP accepted
          </p>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <Progress value={totalProgress} className="w-full" />
              <p className="text-sm text-blue-600 font-medium">
                {Math.round(totalProgress)}% complete
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Error Messages */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                    Upload Errors
                  </h4>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Gallery Preview */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Uploaded Images</h3>
            <Badge variant="secondary">
              <ImageIcon className="w-3 h-3 mr-1" />
              {images.length} image{images.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  <Card className="relative aspect-square overflow-hidden">
                    <Image
                      src={image.thumbnailUrl}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />

                    {/* Primary Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-blue-600 text-white text-xs">
                          Primary
                        </Badge>
                      </div>
                    )}

                    {/* Optimized Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        WebP
                      </Badge>
                    </div>

                    {/* Upload Progress */}
                    {image.isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
                        <p className="text-white text-xs font-medium">
                          {image.uploadProgress}%
                        </p>
                      </div>
                    )}

                    {/* Error State */}
                    {image.error && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!disabled && !image.isUploading && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(image.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* Image Info */}
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {image.optimizedImages.length} sizes generated
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isProcessing && (
        <Card className="p-8 text-center bg-gray-50 dark:bg-gray-900">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No images uploaded yet. Add images to showcase your listing!
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Images will be automatically optimized and converted to WebP format
          </p>
        </Card>
      )}
    </div>
  );
}
