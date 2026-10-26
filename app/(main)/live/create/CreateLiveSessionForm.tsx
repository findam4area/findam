"use client";

/**
 * Create Live Session Form Component
 *
 * Form for creating and starting a new live streaming session.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2, AlertCircle } from "lucide-react";

interface CreateLiveSessionFormProps {
  userId: string;
}

export function CreateLiveSessionForm({ userId }: CreateLiveSessionFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error("Please enter a title for your live session");
      }

      // Create session
      const createResponse = await fetch("/api/live-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          thumbnail_url: formData.thumbnailUrl.trim() || undefined,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      const { session } = await createResponse.json();

      // Start session
      const startResponse = await fetch(
        `/api/live-sessions/${session.id}/start`,
        {
          method: "POST",
        },
      );

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || "Failed to start session");
      }

      // Redirect to live session page
      router.push(`/live/${session.id}`);
    } catch (err) {
      console.error("Error creating session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create live session",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Session Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="e.g., New iPhone 15 Pro Max Unboxing"
          maxLength={100}
          required
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Tell viewers what you'll be showcasing..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Thumbnail URL */}
      <div>
        <label
          htmlFor="thumbnailUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Thumbnail URL (Optional)
        </label>
        <input
          type="url"
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
          }
          placeholder="https://example.com/thumbnail.jpg"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Live Session Guidelines
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Maximum session duration: 120 minutes</li>
          <li>• You can pin up to 5 products during the session</li>
          <li>• Sessions are recorded and available for 24 hours</li>
          <li>• Followers will be notified when you go live</li>
          <li>• Follow community guidelines to avoid termination</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isCreating || !formData.title.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Starting Live Session...</span>
          </>
        ) : (
          <>
            <Video className="w-5 h-5" />
            <span>Go Live</span>
          </>
        )}
      </button>
    </form>
  );
}
