"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoryRing } from "./story-ring";
import { StoryViewer } from "./story-viewer";
import { StoryCreator } from "./story-creator";
import type { Story } from "@/lib/types";

interface UserStories {
  userId: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    is_premium: boolean;
  };
  stories: Story[];
}

interface StoriesCarouselProps {
  userStories: UserStories[];
  currentUserId?: string;
  onRefresh?: () => void;
}

export function StoriesCarousel({
  userStories,
  currentUserId,
  onRefresh,
}: StoriesCarouselProps) {
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(
    null,
  );
  const [showCreator, setShowCreator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 300;
    const newScrollLeft =
      scrollRef.current.scrollLeft +
      (direction === "left" ? -scrollAmount : scrollAmount);

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  const handleStoryClick = (index: number, isOwn: boolean) => {
    if (isOwn && userStories[index].stories.length === 0) {
      setShowCreator(true);
    } else {
      setSelectedUserIndex(index);
    }
  };

  const handleNextUser = () => {
    if (
      selectedUserIndex !== null &&
      selectedUserIndex < userStories.length - 1
    ) {
      setSelectedUserIndex(selectedUserIndex + 1);
    } else {
      setSelectedUserIndex(null);
    }
  };

  const handlePreviousUser = () => {
    if (selectedUserIndex !== null && selectedUserIndex > 0) {
      setSelectedUserIndex(selectedUserIndex - 1);
    }
  };

  const handleStoryView = async (storyId: string) => {
    try {
      await fetch(`/api/stories/${storyId}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track story view:", error);
    }
  };

  if (userStories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative">
        {/* Scroll buttons */}
        {userStories.length > 5 && (
          <>
            <button
              onClick={() => handleScroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-dark-card/80 backdrop-blur-sm rounded-full p-2 hover:bg-dark-card transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-dark-card/80 backdrop-blur-sm rounded-full p-2 hover:bg-dark-card transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </>
        )}

        {/* Stories carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {userStories.map((userStory, index) => {
            const isOwn = currentUserId === userStory.userId;
            return (
              <StoryRing
                key={userStory.userId}
                user={userStory.user}
                hasStories={userStory.stories.length > 0}
                isOwn={isOwn}
                onClick={() => handleStoryClick(index, isOwn)}
              />
            );
          })}
        </div>
      </div>

      {/* Story viewer */}
      {selectedUserIndex !== null && (
        <StoryViewer
          stories={userStories[selectedUserIndex].stories}
          onClose={() => setSelectedUserIndex(null)}
          onNext={handleNextUser}
          onPrevious={handlePreviousUser}
          onStoryView={handleStoryView}
        />
      )}

      {/* Story creator */}
      {showCreator && (
        <StoryCreator
          onClose={() => setShowCreator(false)}
          onSuccess={() => {
            setShowCreator(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
