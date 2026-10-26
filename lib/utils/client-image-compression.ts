/**
 * Client-Side Image Compression Utilities
 * Compresses images before upload to meet size requirements
 * Requirements: 26.6, 26.11
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  fileType?: string;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file to meet size requirements
 * Automatically converts to WebP format for better compression
 * Requirements: 26.6, 26.11
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const {
    maxSizeMB = 5,
    maxWidthOrHeight = 1920,
    quality = 0.8,
    fileType = "image/webp",
  } = options;

  const originalSize = file.size;

  // If file is already small enough and is WebP, return as-is
  if (originalSize <= maxSizeMB * 1024 * 1024 && file.type === "image/webp") {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // Load image
  const image = await loadImage(file);

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    image.width,
    image.height,
    maxWidthOrHeight,
  );

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use better image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw image
  ctx.drawImage(image, 0, 0, width, height);

  // Convert to blob with compression
  let compressedBlob = await canvasToBlob(canvas, fileType, quality);
  let currentQuality = quality;

  // If still too large, reduce quality iteratively
  while (
    compressedBlob.size > maxSizeMB * 1024 * 1024 &&
    currentQuality > 0.1
  ) {
    currentQuality -= 0.1;
    compressedBlob = await canvasToBlob(canvas, fileType, currentQuality);
  }

  // Create new file from blob
  const compressedFile = new File(
    [compressedBlob],
    file.name.replace(/\.[^.]+$/, ".webp"),
    {
      type: fileType,
      lastModified: Date.now(),
    },
  );

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    compressionRatio: compressedFile.size / originalSize,
  };
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      type,
      quality,
    );
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
): Promise<CompressionResult[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Generate thumbnail from image
 * Requirements: 26.4
 */
export async function generateThumbnail(
  file: File,
  size: number = 256,
): Promise<File> {
  const image = await loadImage(file);

  // Calculate thumbnail dimensions (square crop)
  const minDimension = Math.min(image.width, image.height);
  const sx = (image.width - minDimension) / 2;
  const sy = (image.height - minDimension) / 2;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Draw cropped and resized image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    sx,
    sy,
    minDimension,
    minDimension,
    0,
    0,
    size,
    size,
  );

  // Convert to blob
  const blob = await canvasToBlob(canvas, "image/webp", 0.8);

  // Create file
  return new File([blob], `thumb-${file.name.replace(/\.[^.]+$/, ".webp")}`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

/**
 * Generate multiple image sizes
 * Requirements: 26.4
 */
export async function generateImageSizes(
  file: File,
  sizes: { name: string; maxDimension: number; quality: number }[] = [
    { name: "thumbnail", maxDimension: 256, quality: 0.8 },
    { name: "medium", maxDimension: 800, quality: 0.85 },
    { name: "large", maxDimension: 1920, quality: 0.9 },
  ],
): Promise<{ [key: string]: File }> {
  const image = await loadImage(file);
  const results: { [key: string]: File } = {};

  for (const size of sizes) {
    const { width, height } = calculateDimensions(
      image.width,
      image.height,
      size.maxDimension,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/webp", size.quality);
    const sizedFile = new File(
      [blob],
      `${size.name}-${file.name.replace(/\.[^.]+$/, ".webp")}`,
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );

    results[size.name] = sizedFile;
  }

  return results;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
