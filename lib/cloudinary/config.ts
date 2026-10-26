import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export default cloudinary;

/**
 * Upload file to Cloudinary
 * @param file - File to upload
 * @param folder - Folder path in Cloudinary
 * @returns Secure URL of uploaded file
 */
export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `findam/${folder}`,
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      )
      .end(buffer);
  });
}

/**
 * Generate video thumbnail using Cloudinary
 * @param videoUrl - Cloudinary video URL
 * @returns Thumbnail URL
 */
export function generateVideoThumbnail(videoUrl: string): string {
  // Extract public ID from Cloudinary URL
  const publicId = videoUrl.split("/upload/")[1]?.split(".")[0];
  if (!publicId) return videoUrl;

  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      { width: 400, height: 300, crop: "fill" },
      { quality: "auto" },
      { format: "jpg" },
    ],
  });
}
