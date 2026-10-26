"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface PortfolioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    title: string;
    description: string;
    file: File;
  }) => Promise<void>;
}

export function PortfolioUploadModal({
  isOpen,
  onClose,
  onUpload,
}: PortfolioUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Only JPEG, PNG, WebP, and MP4 files are allowed");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      setError("Please provide a title and select a file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload({
        title: title.trim(),
        description: description.trim(),
        file,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-dark-card border border-dark-border rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-border">
                <h2 className="text-xl font-semibold text-white">
                  Add Portfolio Item
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  aria-label="Close modal"
                  className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="file">Media File *</Label>
                  <div className="mt-2">
                    {preview ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-dark-bg">
                        {file?.type.startsWith("image/") ? (
                          <Image
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, 600px"
                          />
                        ) : (
                          <video
                            src={preview}
                            controls
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                          }}
                          aria-label="Remove file"
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="file"
                        className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-dark-border rounded-lg cursor-pointer hover:border-naija-green transition-colors"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">
                          Click to upload image or video
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Max 10MB • JPEG, PNG, WebP, MP4
                        </span>
                      </label>
                    )}
                    <input
                      id="file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter portfolio item title"
                    maxLength={100}
                    disabled={isUploading}
                    className="mt-2"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your work (optional)"
                    maxLength={500}
                    rows={3}
                    disabled={isUploading}
                    className="mt-2"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !file || !title.trim()}
                    className="flex-1"
                  >
                    {isUploading ? "Uploading..." : "Add to Portfolio"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
