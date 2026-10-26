"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { handleImageError, getImageFallback } from "@/lib/errors";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackType?: "listing" | "avatar" | "category";
  fallbackSrc?: string;
}

/**
 * Image component with automatic fallback handling
 * Implements Requirement 19.2: Display placeholder images when images fail to load
 */
export function ImageWithFallback({
  src,
  alt,
  fallbackType = "listing",
  fallbackSrc,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (hasError) return; // Prevent infinite loop

    setHasError(true);
    const fallback = fallbackSrc || getImageFallback(fallbackType);
    setImgSrc(fallback);

    // Track the error
    handleImageError(e, fallbackType);
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
}
