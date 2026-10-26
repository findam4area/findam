"use client";

import { useEffect, useState } from "react";
import { StoriesCarousel } from "@/components/stories";
import { useStories } from "@/lib/hooks/useStories";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function StoriesPage() {
  const { stories, isLoading, error, fetchStories } = useStories();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchStories}
            className="px-4 py-2 bg-neon-cyan text-dark-bg rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Stories</h1>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 mb-4">No stories available</p>
            <p className="text-white/40 text-sm">
              Be the first to share a story!
            </p>
          </div>
        ) : (
          <StoriesCarousel
            userStories={stories}
            currentUserId={currentUserId}
            onRefresh={fetchStories}
          />
        )}
      </div>
    </div>
  );
}
