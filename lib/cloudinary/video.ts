/**
 * Video Upload and Processing Service
 * Requirements: 1.1
 */

import cloudinary from "./config";
import { validateVideoDuration } from "@/lib/types/video";

export interface VideoUploadOptions {
  folder?: string;
  maxDuration?: number;
  minDuration?: number;
}

export interface VideoUploadResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  publicId: string;
}

/**
 * Upload video to Cloudinary with transcoding and validation
 * Requirement: 1.1 - Videos must be 15-60 seconds
 */
export async function uploadVideo(
  file: File,
  options: VideoUploadOptions = {},
): Promise<VideoUploadResult> {
  const { folder = "videos", maxDuration = 60, minDuration = 15 } = options;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "video",
          folder: `findam/${folder}`,
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
          eager: [
            {
              width: 1080,
              height: 1920,
              crop: "fill",
              gravity: "center",
              format: "mp4",
            },
          ],
          eager_async: true,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Video upload failed: ${error.message}`));
            return;
          }

          if (!result) {
            reject(new Error("Video upload failed: No result returned"));
            return;
          }

          // Validate duration
          const duration = result.duration || 0;
          const validation = validateVideoDuration(duration);

          if (!validation.valid) {
            // Delete the uploaded video since it doesn't meet requirements
            cloudinary.uploader
              .destroy(result.public_id, { resource_type: "video" })
              .catch(console.error);
            reject(new Error(validation.errors.join(", ")));
            return;
          }

          // Generate thumbnail
          const thumbnailUrl = generateVideoThumbnail(result.public_id);

          resolve({
            videoUrl: result.secure_url,
            thumbnailUrl,
            duration,
            publicId: result.public_id,
          });
        },
      )
      .end(buffer);
  });
}

/**
 * Generate thumbnail from video public ID
 * Requirement: 1.1
 */
export function generateVideoThumbnail(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      { width: 400, height: 711, crop: "fill", gravity: "center" },
      { quality: "auto" },
      { format: "jpg" },
      { start_offset: "1" }, // Get frame at 1 second
    ],
  });
}

/**
 * Delete video from Cloudinary
 */
export async function deleteVideo(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (error) {
    console.error("Failed to delete video:", error);
    throw new Error("Failed to delete video");
  }
}

/**
 * Get video metadata from Cloudinary
 */
export async function getVideoMetadata(publicId: string): Promise<{
  duration: number;
  width: number;
  height: number;
  format: string;
}> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "video",
    });

    return {
      duration: result.duration || 0,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format || "",
    };
  } catch (error) {
    console.error("Failed to get video metadata:", error);
    throw new Error("Failed to get video metadata");
  }
}
