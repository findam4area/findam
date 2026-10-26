"use client";

import { useState, useEffect, useRef } from "react";
import { getOptimizedImageUrl } from "@/lib/cdn/optimization";

/**
 * Lazy-loaded image component with Intersection Observer
 * Requirements: Performance optimization
 */

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = "",
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E",
  onLoad,
  priority = false,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.01,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Get optimized image URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality: "auto",
    format: "auto",
  });

  return (
    <img
      ref={imgRef}
      src={isInView ? optimizedSrc : placeholder}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      onLoad={handleLoad}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
