"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

export interface SparklesProps {
  className?: string;
  children?: React.ReactNode;
  sparkleCount?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
}

const generateSparkle = (
  colors: string[],
  minSize: number,
  maxSize: number,
): Sparkle => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * (maxSize - minSize) + minSize,
    delay: Math.random() * 0.5,
  };
};

export const Sparkles: React.FC<SparklesProps> = ({
  className,
  children,
  sparkleCount = 10,
  colors = ["#00ff41", "#00d9ff", "#ff6b35"],
  minSize = 10,
  maxSize = 20,
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const newSparkle = generateSparkle(colors, minSize, maxSize);
      setSparkles((prev) => [...prev.slice(-sparkleCount + 1), newSparkle]);
    }, 200);

    return () => clearInterval(interval);
  }, [sparkleCount, colors, minSize, maxSize]);

  // Don't render sparkles until mounted on client
  if (!mounted) {
    return (
      <div className={cn("relative inline-block", className)}>{children}</div>
    );
  }

  return (
    <div className={cn("relative inline-block", className)}>
      {children}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.5, delay: sparkle.delay }}
              style={{
                position: "absolute",
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
              }}
            >
              <svg
                width={sparkle.size}
                height={sparkle.size}
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
                  fill={sparkle.color}
                />
              </svg>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const SparkleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  sparkleOnHover?: boolean;
}> = ({ children, onClick, className, sparkleOnHover = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const handleClick = () => {
    setShowSparkles(true);
    onClick?.();
    setTimeout(() => setShowSparkles(false), 1000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative", className)}
    >
      {(showSparkles || (sparkleOnHover && isHovered)) && (
        <Sparkles sparkleCount={8}>
          <div className="opacity-0">{children}</div>
        </Sparkles>
      )}
      {children}
    </button>
  );
};
