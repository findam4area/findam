"use client";

import { motion } from "framer-motion";
import {
  Smartphone,
  Shirt,
  UtensilsCrossed,
  Home,
  Car,
  Wrench,
  Briefcase,
  BookOpen,
  Dumbbell,
  Sparkle,
  Package,
  type LucideIcon
} from "lucide-react";

interface CategoryHeaderProps {
  category: {
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    accentColor?: string | null;
  };
  listingCount: number;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Smartphone,
  fashion: Shirt,
  food: UtensilsCrossed,
  "real-estate": Home,
  properties: Home,
  vehicles: Car,
  services: Wrench,
  home: Home,
  jobs: Briefcase,
  books: BookOpen,
  sports: Dumbbell,
  beauty: Sparkle,
};

export function CategoryHeader({ category, listingCount }: CategoryHeaderProps) {
  const IconComponent = CATEGORY_ICONS[category.slug] || Package;
  const accentColor = category.accentColor || "#00C853";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 p-8"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: "32px 32px"
        }} />
      </div>

      <div className="relative flex items-start gap-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-sm"
          style={{
            boxShadow: `0 0 30px ${accentColor}40`
          }}
        >
          <IconComponent className="w-10 h-10 text-white" style={{ color: accentColor }} />
        </motion.div>

        {/* Content */}
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {category.name}
          </motion.h1>
          
          {category.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-lg mb-4 max-w-3xl"
            >
              {category.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 flex-wrap"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Package className="w-4 h-4" style={{ color: accentColor }} />
              <span className="text-white font-medium">
                {listingCount.toLocaleString()} {listingCount === 1 ? "listing" : "listings"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              <span className="text-white font-medium">Active Marketplace</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
