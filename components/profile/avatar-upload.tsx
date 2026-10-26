"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAvatarAction } from "@/app/actions/profile";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarUploadProps {
  user: User;
  onSuccess?: (url: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({
  user,
  onSuccess,
  className,
  size = "md",
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    user.avatar_url || null,
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizes = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be less than 2MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("File must be JPEG, PNG, or WebP");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatarAction(user.id, formData);

      if (result.error) {
        setError(result.error);
        setPreview(user.avatar_url || null);
      } else if (result.data) {
        if (onSuccess) {
          onSuccess(result.data.url);
        }
      }
    } catch (err) {
      setError("Failed to upload avatar");
      setPreview(user.avatar_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-full border-2 border-dashed border-dark-border transition-colors hover:border-naija-green",
            sizes[size],
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {preview ? (
            <Image
              src={preview}
              alt="Avatar preview"
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-naija-green/20 to-neon-cyan/20">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/50"
            aria-label="Upload avatar"
          >
            <Upload className="h-6 w-6 text-white opacity-0 transition-opacity hover:opacity-100" />
          </button>
        </motion.div>

        {preview && !isUploading && (
          <motion.button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
        aria-label="Avatar file input"
      />

      <div className="text-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {preview ? "Change" : "Upload"} Avatar
            </>
          )}
        </Button>
        <p className="mt-1 text-xs text-gray-400">
          Max 2MB. JPEG, PNG, or WebP.
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            className="text-center text-xs text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
