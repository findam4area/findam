"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ParallaxScrollProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "up" | "down";
}

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
  children,
  className,
  speed = 0.5,
  direction = "up",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === "up"
      ? [100 * speed, -100 * speed]
      : [-100 * speed, 100 * speed],
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

export interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  offset?: number;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  className,
  speed = 0.5,
  offset = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [offset, offset - 100 * speed],
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

export interface ParallaxModalProps {
  children: React.ReactNode;
  className?: string;
  headerContent?: React.ReactNode;
  headerClassName?: string;
}

export const ParallaxModal: React.FC<ParallaxModalProps> = ({
  children,
  className,
  headerContent,
  headerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const headerY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const headerScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto h-full", className)}
    >
      {headerContent && (
        <motion.div
          style={{
            y: headerY,
            opacity: headerOpacity,
            scale: headerScale,
          }}
          className={cn("sticky top-0 z-10", headerClassName)}
        >
          {headerContent}
        </motion.div>
      )}
      <div className="relative z-0">{children}</div>
    </div>
  );
};

export const useParallax = (value: MotionValue<number>, distance: number) => {
  return useTransform(value, [0, 1], [-distance, distance]);
};
