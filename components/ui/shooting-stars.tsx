"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export interface ShootingStarsProps {
  className?: string;
  starCount?: number;
  minSpeed?: number;
  maxSpeed?: number;
  minSize?: number;
  maxSize?: number;
}

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  className,
  starCount = 20,
  minSpeed = 10,
  maxSpeed = 30,
  minSize = 1,
  maxSize = 3,
}) => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const generateStars = () => {
      const newStars: Star[] = [];
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * (maxSize - minSize) + minSize,
          duration: Math.random() * (maxSpeed - minSpeed) + minSpeed,
          delay: Math.random() * 20,
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, [starCount, minSpeed, maxSpeed, minSize, maxSize]);

  // Don't render anything until mounted on client
  if (!mounted) {
    return (
      <div
        className={cn(
          "absolute inset-0 overflow-hidden pointer-events-none",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white opacity-0 animate-shooting-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `shooting-star ${star.duration}s linear ${star.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes shooting-star {
          0% {
            transform: translate(0, 0) rotate(45deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(-300px, 300px) rotate(45deg);
            opacity: 0;
          }
        }
        .animate-shooting-star {
          box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export const ShootingStarsBackground: React.FC<{
  children?: React.ReactNode;
  className?: string;
  starCount?: number;
}> = ({ children, className, starCount = 20 }) => {
  return (
    <div className={cn("relative", className)}>
      <ShootingStars starCount={starCount} />
      {children}
    </div>
  );
};
