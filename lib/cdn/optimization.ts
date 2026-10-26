/**
 * CDN optimization utilities for images and videos
 * Requirements: Performance optimization
 *
 * Uses Cloudinary for CDN delivery with automatic optimization
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "fill" | "fit" | "scale" | "thumb";
  gravity?: "auto" | "face" | "center";
}

export interface VideoOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number | "auto";
  format?: "auto" | "mp4" | "webm";
  bitRate?: string;
}

/**
 * Generate optimized Cloudinary image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: ImageOptimizationOptions = {},
): string {
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
    gravity = "auto",
  } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.warn("Cloudinary cloud name not configured");
    return publicId;
  }

  const transformations: string[] = [];

  // Quality
  transformations.push(`q_${quality}`);

  // Format
  transformations.push(`f_${format}`);

  // Dimensions
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  // Crop mode
  transformations.push(`c_${crop}`);

  // Gravity
  if (gravity) transformations.push(`g_${gravity}`);

  // Fetch format (for better compression)
  transformations.push("fl_progressive");

  // DPR (Device Pixel Ratio) auto
  transformations.push("dpr_auto");

  const transformString = transformations.join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Generate optimized Cloudinary video URL
 */
export function getOptimizedVideoUrl(
  publicId: string,
  options: VideoOptimizationOptions = {},
): string {
  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    bitRate = "1m",
  } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.warn("Cloudinary cloud name not configured");
    return publicId;
  }

  const transformations: string[] = [];

  // Quality
  transformations.push(`q_${quality}`);

  // Format
  transformations.push(`f_${format}`);

  // Dimensions
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  // Bit rate
  transformations.push(`br_${bitRate}`);

  // Video codec
  transformations.push("vc_auto");

  const transformString = transformations.join(",");

  return `https://res.cloudinary.com/${cloudName}/video/upload/${transformString}/${publicId}`;
}

/**
 * Responsive image sizes for different breakpoints
 */
export const RESPONSIVE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 320, height: 320 },
  medium: { width: 640, height: 640 },
  large: { width: 1024, height: 1024 },
  xlarge: { width: 1920, height: 1920 },
};

/**
 * Generate srcset for responsive images
 */
export function generateImageSrcSet(
  publicId: string,
  sizes: Array<keyof typeof RESPONSIVE_SIZES> = ["small", "medium", "large"],
): string {
  return sizes
    .map((size) => {
      const { width } = RESPONSIVE_SIZES[size];
      const url = getOptimizedImageUrl(publicId, { width, quality: "auto" });
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Preload critical images
 */
export function preloadImage(url: string, as: "image" | "fetch" = "image") {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading() {
  if (typeof window === "undefined") return;

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    },
  );

  // Observe all images with data-src attribute
  document.querySelectorAll("img[data-src]").forEach((img) => {
    imageObserver.observe(img);
  });

  return imageObserver;
}

/**
 * CDN cache control headers
 */
export const CDN_CACHE_HEADERS = {
  // Images - cache for 1 year
  image: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
  // Videos - cache for 1 year
  video: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
  // API responses - cache for 5 minutes
  api: {
    "Cache-Control":
      "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
  },
  // Static assets - cache for 1 year
  static: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
};
