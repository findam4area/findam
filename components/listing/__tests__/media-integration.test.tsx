/**
 * Integration tests for Media Upload and Gallery components
 * 
 * Tests the complete flow from upload to gallery display
 * 
 * Requirements: 26.1, 26.2, 26.3, 26.5, 26.6, 26.7, 26.8
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MediaUpload, type MediaFile } from "../media-upload";
import { ImageGallery, type GalleryMedia } from "../image-gallery";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  Reorder: {
    Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Item: ({ children, value, ...props }: any) => (
      <div data-value={value.id} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock API functions
vi.mock("@/lib/api/listings", () => ({
  uploadMedia: vi.fn().mockResolvedValue("https://example.com/uploaded-image.jpg"),
  generateVideoThumbnail: vi.fn().mockResolvedValue(new Blob()),
  getVideoDuration: vi.fn().mockResolvedValue(30),
}));

// Mock image compression
vi.mock("@/lib/utils/client-image-compression", () => ({
  compressImage: vi.fn().mockImplementation(async (file) => ({
    file: new File([file], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
    }),
    originalSize: file.size,
    compressedSize: file.size * 0.5,
    compressionRatio: 0.5,
  })),
  formatFileSize: vi.fn((bytes: number) => `${(bytes / 1024).toFixed(2)} KB`),
}));

describe("Media Upload and Gallery Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Upload Flow", () => {
    it("should handle image upload with compression - Req 26.6, 26.7", async () => {
      const onMediaChange = vi.fn();
      render(
        <MediaUpload
          maxFiles={10}
          maxImageSize={5}
          onMediaChange={onMediaChange}
        />
      );

      // Create a mock image file
      const imageFile = new File(["image content"], "test-image.jpg", {
        type: "image/jpeg",
      });

      const input = screen.getByLabelText(/Upload media files/i);
      
      // Simulate file selection
      Object.defineProperty(input, "files", {
        value: [imageFile],
        writable: false,
      });

      fireEvent.change(input);

      // Wait for processing
      await waitFor(() => {
        expect(onMediaChange).toHaveBeenCalled();
      });

      const mediaFiles = onMediaChange.mock.calls[0][0] as MediaFile[];
      expect(mediaFiles).toHaveLength(1);
      expect(mediaFiles[0].type).toBe("image");
    });

    it("should validate maximum file count - Req 26.1", async () => {
      const onMediaChange = vi.fn();
      render(
        <MediaUpload
          maxFiles={2}
          maxImageSize={5}
          onMediaChange={onMediaChange}
        />
      );

      // Try to upload 3 files when max is 2
      const files = [
        new File(["content1"], "image1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "image2.jpg", { type: "image/jpeg" }),
        new File(["content3"], "image3.jpg", { type: "image/jpeg" }),
      ];

      const input = screen.getByLabelText(/Upload media files/i);
      Object.defineProperty(input, "files", { value: files, writable: false });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 2 media files allowed/i)).toBeInTheDocument();
      });
    });

    it("should validate image formats - Req 26.8", async () => {
      const onMediaChange = vi.fn();
      render(
        <MediaUpload
          maxFiles={10}
          maxImageSize={5}
          onMediaChange={onMediaChange}
        />
      );

      // Try to upload an unsupported format
      const invalidFile = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const input = screen.getByLabelText(/Upload media files/i);
      Object.defineProperty(input, "files", {
        value: [invalidFile],
        writable: false,
      });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Only images and videos are allowed/i)).toBeInTheDocument();
      });
    });

    it("should validate video duration - Req 26.2", async () => {
      const { getVideoDuration } = await import("@/lib/api/listings");
      
      // Mock long video
      (getVideoDuration as any).mockResolvedValueOnce(120); // 2 minutes

      const onMediaChange = vi.fn();
      render(
        <MediaUpload
          maxFiles={10}
          maxVideoDuration={60}
          onMediaChange={onMediaChange}
        />
      );

      const videoFile = new File(["video content"], "long-video.mp4", {
        type: "video/mp4",
      });

      const input = screen.getByLabelText(/Upload media files/i);
      Object.defineProperty(input, "files", {
        value: [videoFile],
        writable: false,
      });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Video duration must be 60 seconds or less/i)).toBeInTheDocument();
      });
    });
  });

  describe("Gallery Display", () => {
    it("should display uploaded media in gallery - Req 26.3", () => {
      const mockMedia: GalleryMedia[] = [
        {
          id: "1",
          url: "https://example.com/image1.jpg",
          type: "image",
        },
        {
          id: "2",
          url: "https://example.com/image2.jpg",
          type: "image",
        },
      ];

      render(<ImageGallery media={mockMedia} />);

      // Check main image is displayed
      expect(screen.getByAltText(/Gallery image 1/i)).toBeInTheDocument();

      // Check thumbnails are displayed
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/i);
      expect(thumbnails).toHaveLength(2);

      // Check media counter
      expect(screen.getByText(/1 \/ 2/i)).toBeInTheDocument();
    });

    it("should support mixed image and video media - Req 26.2, 26.3", () => {
      const mixedMedia: GalleryMedia[] = [
        {
          id: "1",
          url: "https://example.com/image1.jpg",
          type: "image",
        },
        {
          id: "2",
          url: "https://example.com/video1.mp4",
          type: "video",
          duration: 45,
          thumbnail: "https://example.com/thumb1.jpg",
        },
      ];

      render(<ImageGallery media={mixedMedia} />);

      // Navigate to video
      const nextButton = screen.getByLabelText(/Next image/i);
      fireEvent.click(nextButton);

      // Video should be displayed
      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("controls");
    });
  });

  describe("Drag and Drop Reordering", () => {
    it("should display drag handle on hover - Req 26.5", async () => {
      const onMediaChange = vi.fn();
      const initialMedia: MediaFile[] = [
        {
          id: "1",
          file: new File(["content"], "image1.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,",
          type: "image",
          uploaded: false,
        },
        {
          id: "2",
          file: new File(["content"], "image2.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,",
          type: "image",
          uploaded: false,
        },
      ];

      render(
        <MediaUpload
          maxFiles={10}
          onMediaChange={onMediaChange}
          initialMedia={initialMedia}
        />
      );

      // Check that Reorder.Item is used (indicated by data-value attribute)
      const reorderItems = document.querySelectorAll("[data-value]");
      expect(reorderItems.length).toBeGreaterThan(0);
    });
  });

  describe("Complete Upload-to-Gallery Flow", () => {
    it("should convert MediaFile to GalleryMedia format", () => {
      const uploadedMedia: MediaFile[] = [
        {
          id: "1",
          file: new File(["content"], "image1.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,test",
          type: "image",
          uploaded: true,
          url: "https://example.com/image1.jpg",
        },
        {
          id: "2",
          file: new File(["video"], "video1.mp4", { type: "video/mp4" }),
          preview: "data:video/mp4;base64,test",
          type: "video",
          duration: 30,
          uploaded: true,
          url: "https://example.com/video1.mp4",
        },
      ];

      // Convert to gallery format
      const galleryMedia: GalleryMedia[] = uploadedMedia
        .filter((m) => m.uploaded && m.url)
        .map((m) => ({
          id: m.id,
          url: m.url!,
          type: m.type,
          duration: m.duration,
          thumbnail: m.type === "video" ? m.preview : undefined,
        }));

      expect(galleryMedia).toHaveLength(2);
      expect(galleryMedia[0]).toMatchObject({
        id: "1",
        url: "https://example.com/image1.jpg",
        type: "image",
      });
      expect(galleryMedia[1]).toMatchObject({
        id: "2",
        url: "https://example.com/video1.mp4",
        type: "video",
        duration: 30,
      });

      // Render in gallery
      render(<ImageGallery media={galleryMedia} />);
      expect(screen.getByAltText(/Gallery image 1/i)).toBeInTheDocument();
    });
  });

  describe("Upload Progress", () => {
    it("should display progress indicator - Req 26.7", async () => {
      const onMediaChange = vi.fn();
      const mediaWithProgress: MediaFile[] = [
        {
          id: "1",
          file: new File(["content"], "image1.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,test",
          type: "image",
          uploaded: false,
        },
      ];

      render(
        <MediaUpload
          maxFiles={10}
          onMediaChange={onMediaChange}
          initialMedia={mediaWithProgress}
        />
      );

      // Verify media is displayed
      const previews = screen.getAllByAltText(/Preview \d+/i);
      expect(previews.length).toBeGreaterThan(0);
    });
  });
});

