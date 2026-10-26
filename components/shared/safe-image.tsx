/**
 * SafeImage Component
 * 
 * A wrapper around next/image that ensures all src values are valid URLs.
 * Prevents "Failed to parse src" errors by validating and sanitizing image URLs.
 * 
 * Usage: Use this instead of next/image for dynamic image sources
 */

import Image, { ImageProps } from "next/image";
import { getSafeImageUrl } from "@/lib/utils/image-url";

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined;
  fallback?: string;
  title?: string;
}

export function SafeImage({ 
  src, 
  fallback, 
  title,
  alt, 
  ...props 
}: SafeImageProps) {
  const safeSrc = getSafeImageUrl(src, fallback, title || alt);
  
  return <Image src={safeSrc} alt={alt} {...props} />;
}
