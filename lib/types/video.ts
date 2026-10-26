/**
 * Video Listing Types and Interfaces
 * Requirements: 1.1, 1.4
 */

export interface VideoListing {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // 15-60 seconds
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  seller: {
    id: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  views: number;
  likes: number;
}

export interface VideoListingDB {
  id: string;
  listing_id: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface VideoUploadRequest {
  listingId: string;
  videoFile: File;
}

export interface VideoUploadResponse {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates video duration is between 15 and 60 seconds
 * Requirement: 1.1
 */
export function validateVideoDuration(
  durationSeconds: number,
): VideoValidationResult {
  const errors: string[] = [];

  if (typeof durationSeconds !== "number" || isNaN(durationSeconds)) {
    errors.push("Duration must be a valid number");
  } else if (durationSeconds < 15) {
    errors.push("Video duration must be at least 15 seconds");
  } else if (durationSeconds > 60) {
    errors.push("Video duration must not exceed 60 seconds");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates video listing data
 * Requirement: 1.1
 */
export function validateVideoListing(
  data: Partial<VideoListingDB>,
): VideoValidationResult {
  const errors: string[] = [];

  if (!data.listing_id) {
    errors.push("Listing ID is required");
  }

  if (!data.video_url) {
    errors.push("Video URL is required");
  }

  if (!data.thumbnail_url) {
    errors.push("Thumbnail URL is required");
  }

  if (data.duration_seconds !== undefined) {
    const durationValidation = validateVideoDuration(data.duration_seconds);
    if (!durationValidation.valid) {
      errors.push(...durationValidation.errors);
    }
  } else {
    errors.push("Duration is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
