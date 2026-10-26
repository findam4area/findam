"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);

  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, threshold], [0, 360]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    const dampedDistance = Math.min(distance * 0.5, threshold * 1.5);
    pullDistance.set(dampedDistance);
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return;
    setIsPulling(false);

    if (pullDistance.get() >= threshold) {
      setIsRefreshing(true);
      await animate(pullDistance, threshold, { duration: 0.2 });

      try {
        await onRefresh();
      } finally {
        await animate(pullDistance, 0, { duration: 0.3 });
        setIsRefreshing(false);
      }
    } else {
      await animate(pullDistance, 0, { duration: 0.3 });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isPulling && pullDistance.get() > 0) {
        e.preventDefault();
      }
    };

    container.addEventListener("touchmove", preventScroll, { passive: false });
    return () => container.removeEventListener("touchmove", preventScroll);
  }, [isPulling, pullDistance]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        style={{
          height: pullDistance,
          opacity,
        }}
      >
        <motion.div className="relative" style={{ scale }}>
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-naija-green/30"
            style={{
              scale: useTransform(pullDistance, [0, threshold], [1, 2]),
              opacity: useTransform(pullDistance, [0, threshold], [0.5, 0]),
            }}
          />

          {/* Spinner */}
          <motion.div
            className="w-8 h-8 border-4 border-naija-green border-t-transparent rounded-full"
            style={{ rotate }}
          />
        </motion.div>
      </motion.div>

      <motion.div
        style={{
          y: pullDistance,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
