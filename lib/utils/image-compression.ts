/**
 * Image Compression Utilities
 * Handles image compression for low-data mode
 * Requirements: 18.2
 */

import { pwaService } from "@/lib/services/pwa";

export interface ImageCompressionOptions {
  quality?: number; // 0-100, default 50 for low-data mode
  maxWidth?: number; // Maximum width in pixels
  maxHeight?: number; // Maximum height in pixels
  format?: "jpeg" | "webp" | "png";
}

export interface CompressedImage {
  url: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/**
 * Get Cloudinary transformation parameters for low-data mode
 * Requirements: 18.2
 */
export function getLowDataImageUrl(
  originalUrl: string,
  options: ImageCompressionOptions = {},
): string {
  // Check if low-data mode is enabled
  const isLowDataMode = pwaService.isLowDataModeEnabled();

  if (!isLowDataMode) {
    return originalUrl;
  }

  // Default options for low-data mode
  const {
    quality = 50,
    maxWidth = 800,
    maxHeight = 800,
    format = "webp",
  } = options;

  // Check if URL is from Cloudinary
  if (originalUrl.includes("cloudinary.com")) {
    return getCloudinaryLowDataUrl(originalUrl, {
      quality,
      maxWidth,
      maxHeight,
      format,
    });
  }

  // For other URLs, return as-is (could add other CDN support)
  return originalUrl;
}

/**
 * Transform Cloudinary URL for low-data mode
 */
function getCloudinaryLowDataUrl(
  url: string,
  options: ImageCompressionOptions,
): string {
  const { quality, maxWidth, maxHeight, format } = options;

  // Parse Cloudinary URL
  // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  const urlParts = url.split("/upload/");
  if (urlParts.length !== 2) {
    return url; // Invalid Cloudinary URL
  }

  const [baseUrl, pathWithId] = urlParts;

  // Build transformation string
  const transformations = [
    `q_${quality}`, // Quality
    `w_${maxWidth}`, // Max width
    `h_${maxHeight}`, // Max height
    "c_limit", // Limit to max dimensions without cropping
    `f_${format}`, // Format
    "fl_progressive", // Progressive loading
    "fl_lossy", // Lossy compression
  ].join(",");

  // Reconstruct URL with transformations
  return `${baseUrl}/upload/${transformations}/${pathWithId}`;
}

/**
 * Get thumbnail URL for videos in low-data mode
 * Requirements: 18.3
 */
export function getVideoThumbnailUrl(
  videoUrl: string,
  options: { width?: number; height?: number } = {},
): string {
  const { width = 400, height = 300 } = options;

  // Check if URL is from Cloudinary
  if (videoUrl.includes("cloudinary.com")) {
    return getCloudinaryVideoThumbnail(videoUrl, width, height);
  }

  // Check if URL is from Mux
  if (videoUrl.includes("mux.com")) {
    return getMuxVideoThumbnail(videoUrl, width, height);
  }

  // For other URLs, return a placeholder
  return `/api/placeholder/video-thumbnail?w=${width}&h=${height}`;
}

/**
 * Get Cloudinary video thumbnail
 */
function getCloudinaryVideoThumbnail(
  url: string,
  width: number,
  height: number,
): string {
  const urlParts = url.split("/upload/");
  if (urlParts.length !== 2) {
    return url;
  }

  const [baseUrl, pathWithId] = urlParts;

  // Extract video thumbnail at 1 second
  const transformations = [
    `w_${width}`,
    `h_${height}`,
    "c_fill",
    "so_1.0", // Start offset at 1 second
    "f_jpg",
    "q_70",
  ].join(",");

  // Replace /video/ with /image/ for thumbnail
  const thumbnailBaseUrl = baseUrl.replace("/video/", "/image/");

  return `${thumbnailBaseUrl}/upload/${transformations}/${pathWithId}.jpg`;
}

/**
 * Get Mux video thumbnail
 */
function getMuxVideoThumbnail(
  url: string,
  width: number,
  height: number,
): string {
  // Mux thumbnail format: https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg?width=W&height=H&time=T
  const playbackIdMatch = url.match(/\/([^/]+)\.m3u8/);
  if (!playbackIdMatch) {
    return url;
  }

  const playbackId = playbackIdMatch[1];
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&time=1`;
}

/**
 * Calculate estimated data savings
 */
export function calculateDataSavings(
  originalSize: number,
  compressedSize: number,
): {
  savedBytes: number;
  savedMB: number;
  savingsPercentage: number;
} {
  const savedBytes = originalSize - compressedSize;
  const savedMB = savedBytes / (1024 * 1024);
  const savingsPercentage = (savedBytes / originalSize) * 100;

  return {
    savedBytes,
    savedMB,
    savingsPercentage,
  };
}

/**
 * Estimate image size based on dimensions and quality
 */
export function estimateImageSize(
  width: number,
  height: number,
  quality: number = 80,
): number {
  // Rough estimate: pixels * bytes per pixel * quality factor
  const pixels = width * height;
  const bytesPerPixel = 3; // RGB
  const qualityFactor = quality / 100;
  const compressionFactor = 0.1; // JPEG compression

  return Math.ceil(pixels * bytesPerPixel * qualityFactor * compressionFactor);
}

/**
 * Get responsive image srcset for low-data mode
 */
export function getLowDataSrcSet(
  originalUrl: string,
  sizes: number[] = [400, 800, 1200],
): string {
  const isLowDataMode = pwaService.isLowDataModeEnabled();

  if (!isLowDataMode) {
    // Return standard srcset
    return sizes
      .map((size) => {
        const url = getLowDataImageUrl(originalUrl, {
          maxWidth: size,
          quality: 80,
        });
        return `${url} ${size}w`;
      })
      .join(", ");
  }

  // Return low-data srcset with reduced quality
  return sizes
    .map((size) => {
      const url = getLowDataImageUrl(originalUrl, {
        maxWidth: size,
        quality: 50,
      });
      return `${url} ${size}w`;
    })
    .join(", ");
}

/**
 * Preload image with low-data mode support
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = getLowDataImageUrl(url);
  });
}

/**
 * Check if video should auto-play based on low-data mode
 * Requirements: 18.3
 */
export function shouldAutoPlayVideo(): boolean {
  return !pwaService.isLowDataModeEnabled();
}

/**
 * Get video quality based on low-data mode
 */
export function getVideoQuality(): "auto" | "low" | "medium" | "high" {
  const isLowDataMode = pwaService.isLowDataModeEnabled();
  return isLowDataMode ? "low" : "auto";
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
