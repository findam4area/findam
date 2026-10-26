"use client";

import { useState } from "react";
import { PortfolioItem } from "@/lib/types";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";

interface PortfolioGridProps {
  items: PortfolioItem[];
  onItemClick?: (item: PortfolioItem) => void;
  editable?: boolean;
  onDelete?: (id: string) => void;
  onReorder?: (items: PortfolioItem[]) => void;
}

export function PortfolioGrid({
  items,
  onItemClick,
  editable = false,
  onDelete,
  onReorder,
}: PortfolioGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-400 mb-2">No portfolio items yet</div>
        {editable && (
          <p className="text-sm text-gray-500">
            Add your first portfolio item to showcase your work
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative group"
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-dark-card border border-dark-border"
            onClick={() => onItemClick?.(item)}
          >
            {item.media_type === "image" ? (
              <Image
                src={item.media_url}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={item.media_url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
            )}

            {/* Overlay on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: hoveredId === item.id ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4"
            >
              <h3 className="text-white font-semibold text-lg mb-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-gray-300 text-sm line-clamp-2">
                  {item.description}
                </p>
              )}
            </motion.div>

            {/* Delete button for editable mode */}
            {editable && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredId === item.id ? 1 : 0,
                  scale: hoveredId === item.id ? 1 : 0.8,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item.id);
                }}
                aria-label={`Delete ${item.title}`}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
