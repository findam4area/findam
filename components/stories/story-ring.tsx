"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Plus } from "lucide-react";

interface StoryRingProps {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    is_premium: boolean;
  };
  hasStories: boolean;
  isOwn?: boolean;
  onClick: () => void;
}

export function StoryRing({
  user,
  hasStories,
  isOwn,
  onClick,
}: StoryRingProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-w-[80px]"
    >
      <div className="relative">
        {/* Story ring */}
        <div
          className={`relative w-20 h-20 rounded-full p-[3px] ${
            hasStories
              ? user.is_premium
                ? "bg-gradient-to-tr from-yellow-400 via-yellow-500 to-yellow-600"
                : "bg-gradient-to-tr from-neon-cyan via-neon-pink to-neon-yellow"
              : "bg-dark-border"
          }`}
        >
          <div className="w-full h-full rounded-full bg-dark-bg p-[2px]">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                width={72}
                height={72}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center text-white font-semibold text-xl">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Add story button for own profile */}
        {isOwn && !hasStories && (
          <div className="absolute bottom-0 right-0 bg-neon-cyan rounded-full p-1 border-2 border-dark-bg">
            <Plus size={16} className="text-dark-bg" />
          </div>
        )}

        {/* Premium badge */}
        {user.is_premium && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor"
                className="text-dark-bg"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Username */}
      <span className="text-xs text-white/80 truncate max-w-[80px]">
        {isOwn ? "Your Story" : user.username}
      </span>
    </motion.button>
  );
}
