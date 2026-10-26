"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Star, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  photos: string[];
  primaryPhotoUrl?: string;
  onPhotosChange: (photos: File[]) => Promise<void>;
  onPrimaryPhotoChange: (url: string) => void;
  onPhotoRemove: (url: string) => void;
  maxPhotos?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DEFAULT_MAX_PHOTOS = 50;
const DEFAULT_MAX_FILE_SIZE = 5; // 5MB

export function PhotoUploader({
  photos,
  primaryPhotoUrl,
  onPhotosChange,
  onPrimaryPhotoChange,
  onPhotoRemove,
  maxPhotos = DEFAULT_MAX_PHOTOS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];

    // Check total count
    if (photos.length + files.length > maxPhotos) {
      errors.push(`Maximum ${maxPhotos} photos allowed. You can add ${maxPhotos - photos.length} more.`);
      return { valid: [], errors };
    }

    for (const file of files) {
      // Check file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are accepted.`);
        continue;
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSize) {
        errors.push(`${file.name}: File size exceeds ${maxFileSize}MB limit.`);
        continue;
      }

      valid.push(file);
    }

    return { valid, errors };
  }, [photos.length, maxPhotos, maxFileSize]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    const { valid, errors: validationErrors } = validateFiles(fileArray);

    setErrors(validationErrors);

    if (valid.length > 0) {
      setIsUploading(true);
      try {
        await onPhotosChange(valid);
        setErrors([]);
      } catch (error) {
        setErrors([error instanceof Error ? error.message : "Failed to upload photos"]);
      } finally {
        setIsUploading(false);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleRemove = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onPhotoRemove(url);
      // If removing primary photo, clear it
      if (url === primaryPhotoUrl && photos.length > 1) {
        const nextPhoto = photos.find(p => p !== url);
        if (nextPhoto) {
          onPrimaryPhotoChange(nextPhoto);
        }
      }
    }
  };

  const handleSetPrimary = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onPrimaryPhotoChange(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={cn(
          "relative border-2 border-dashed transition-all",
          isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-blue-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isDragging ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          </motion.div>

          <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop photos here, or click to select files
          </p>
          <p className="text-xs text-gray-500">
            {photos.length} / {maxPhotos} photos • Max {maxFileSize}MB per file • JPEG, PNG, WebP
          </p>

          {isUploading && (
            <div className="mt-4">
              <div className="animate-pulse text-sm text-blue-600">Uploading...</div>
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

      {/* Photo Gallery Preview */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Photo Gallery</h3>
            <Badge variant="secondary">
              <ImageIcon className="w-3 h-3 mr-1" />
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {photos.map((photoUrl, index) => (
                <motion.div
                  key={photoUrl}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  <Card className="relative aspect-square overflow-hidden">
                    <Image
                      src={photoUrl}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />

                    {/* Primary Badge */}
                    {photoUrl === primaryPhotoUrl && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-blue-600 text-white">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Primary
                        </Badge>
                      </div>
                    )}

                    {/* Actions Overlay */}
                    {!disabled && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {photoUrl !== primaryPhotoUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => handleSetPrimary(photoUrl, e)}
                            className="text-xs"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Set Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handleRemove(photoUrl, e)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Helper Text */}
          {!primaryPhotoUrl && photos.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Select a primary photo to display as your business thumbnail
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && !isUploading && (
        <Card className="p-8 text-center bg-gray-50 dark:bg-gray-900">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No photos uploaded yet. Add photos to showcase your business!
          </p>
        </Card>
      )}
    </div>
  );
}
