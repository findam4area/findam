"use client";

/**
 * Optimized Image Component
 * Automatically applies low-data mode optimizations
 * Requirements: 18.2
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getLowDataImageUrl,
  getLowDataSrcSet,
} from "@/lib/utils/image-compression";
import { pwaService } from "@/lib/services/pwa";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    // Check low-data mode status
    const lowDataMode = pwaService.isLowDataModeEnabled();
    setIsLowDataMode(lowDataMode);

    // Update image source based on low-data mode
    if (lowDataMode) {
      const optimizedUrl = getLowDataImageUrl(src, {
        quality: quality || 50,
        maxWidth: width || 800,
        maxHeight: height || 800,
      });
      setImageSrc(optimizedUrl);
    } else {
      setImageSrc(src);
    }
  }, [src, width, height, quality]);

  // Generate srcset for responsive images
  const srcSet = isLowDataMode
    ? getLowDataSrcSet(src, [400, 800, 1200])
    : undefined;

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes}
        quality={isLowDataMode ? 50 : quality}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      quality={isLowDataMode ? 50 : quality}
      onLoad={onLoad}
      onError={onError}
      {...(srcSet && { srcSet })}
    />
  );
}
