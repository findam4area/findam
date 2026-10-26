"use client";

import { useState } from "react";
import { Upload, Music, X } from "lucide-react";
import { CreateTrendingSoundData } from "@/lib/services/trending-sounds";

interface AudioUploadFormProps {
  onSubmit: (data: CreateTrendingSoundData) => Promise<void>;
  onCancel?: () => void;
}

const SOUND_CATEGORIES = [
  "Pop",
  "Hip Hop",
  "Electronic",
  "Rock",
  "R&B",
  "Afrobeats",
  "Jazz",
  "Classical",
  "Other",
];

export function AudioUploadForm({ onSubmit, onCancel }: AudioUploadFormProps) {
  const [formData, setFormData] = useState<CreateTrendingSoundData>({
    title: "",
    artist: "",
    audio_url: "",
    duration_seconds: undefined,
    category: "",
    tags: [],
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);

      // Get audio duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setFormData({
          ...formData,
          duration_seconds: Math.floor(audio.duration),
        });
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload audio file to storage
      const fileExt = audioFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // In a real implementation, upload to Supabase Storage
      // For now, we'll use a placeholder URL
      const audioUrl = `/audio/${fileName}`;

      clearInterval(uploadInterval);
      setUploadProgress(100);

      await onSubmit({
        ...formData,
        audio_url: audioUrl,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Audio File Upload */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Upload Audio File
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Audio File <span className="text-red-500">*</span>
            </label>
            {audioFile ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 p-4">
                <div className="flex items-center space-x-3">
                  <Music className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {audioFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      {formData.duration_seconds &&
                        ` • ${formData.duration_seconds}s`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:bg-gray-100">
                <Upload className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-700">
                  Click to upload audio file
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  MP3, WAV, or OGG (max 10MB)
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sound Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Sound Details
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="sound-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="sound-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Summer Vibes Beat"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Artist */}
          <div>
            <label
              htmlFor="sound-artist"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Artist
            </label>
            <input
              id="sound-artist"
              type="text"
              value={formData.artist}
              onChange={(e) =>
                setFormData({ ...formData, artist: e.target.value })
              }
              placeholder="e.g., DJ Producer"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="sound-category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="sound-category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              title="Select sound category"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {SOUND_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Add a tag..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                aria-label="Add tag"
                title="Add tag"
              >
                Add
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center space-x-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                      aria-label={`Remove ${tag} tag`}
                      title={`Remove ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!audioFile || uploading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Upload Sound"}
        </button>
      </div>
    </form>
  );
}
