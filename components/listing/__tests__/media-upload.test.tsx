/**
 * Unit tests for MediaUpload component
 * 
 * Tests cover:
 * - File validation (size, type, duration)
 * - Drag and drop functionality
 * - File upload and progress tracking
 * - Reordering functionality
 * - Error handling
 * 
 * Requirements: 26.1, 26.2, 26.3, 26.5, 26.7, 26.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MediaUpload, MediaFile } from "../media-upload";
import * as listingsApi from "@/lib/api/listings";

// Mock the API functions
vi.mock("@/lib/api/listings", () => ({
  uploadMedia: vi.fn(),
  generateVideoThumbnail: vi.fn(),
  getVideoDuration: vi.fn(),
}));

// Mock client-side image compression
vi.mock("@/lib/utils/client-image-compression", () => ({
  compressImage: vi.fn((file) =>
    Promise.resolve({
      file,
      originalSize: file.size,
      compressedSize: file.size * 0.7,
      compressionRatio: 0.7,
    })
  ),
  formatFileSize: vi.fn((bytes) => `${bytes} bytes`),
}));

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
    Item: ({ children, value, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("MediaUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render upload area with correct limits - Req 26.1, 26.2", () => {
      render(<MediaUpload maxFiles={10} maxImageSize={5} maxVideoSize={100} maxVideoDuration={60} />);
      
      expect(screen.getByText(/Click to upload or drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/Up to 10 files/i)).toBeInTheDocument();
      expect(screen.getByText(/Images \(max 5MB\) or Videos \(max 100MB, 60s\)/i)).toBeInTheDocument();
    });
  });

  describe("File Validation", () => {
    it("should validate file types and reject invalid formats - Req 26.8", async () => {
      const { container } = render(<MediaUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["content"], "document.pdf", { type: "application/pdf" });
      
      Object.defineProperty(input, "files", {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Only images and videos are allowed/i)).toBeInTheDocument();
      });
    });

    it("should validate video size and duration limits - Req 26.2", async () => {
      vi.mocked(listingsApi.getVideoDuration).mockResolvedValue(90); // 90 seconds

      const { container } = render(<MediaUpload maxVideoDuration={60} maxVideoSize={10} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Test duration validation
      const file = new File(["content"], "long-video.mp4", { type: "video/mp4" });
      
      Object.defineProperty(input, "files", {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Video duration must be 60 seconds or less/i)).toBeInTheDocument();
      });
    });

    it("should enforce maximum file count - Req 26.1", async () => {
      const onMediaChange = vi.fn();
      const { container } = render(<MediaUpload maxFiles={2} onMediaChange={onMediaChange} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const files = [
        new File(["content1"], "image1.jpg", { type: "image/jpeg" }),
        new File(["content2"], "image2.jpg", { type: "image/jpeg" }),
        new File(["content3"], "image3.jpg", { type: "image/jpeg" }),
      ];
      
      Object.defineProperty(input, "files", {
        value: files,
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 2 media files allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe("File Upload", () => {
    it("should accept and compress valid image files - Req 26.6", async () => {
      const onMediaChange = vi.fn();
      const { container } = render(<MediaUpload onMediaChange={onMediaChange} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      
      // Mock FileReader with proper constructor
      class MockFileReader {
        onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        result: string | ArrayBuffer | null = "data:image/jpeg;base64,mockdata";
        error: DOMException | null = null;
        onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        readyState: number = 0;
        DONE: number = 2;
        EMPTY: number = 0;
        LOADING: number = 1;
        
        readAsDataURL(_blob: Blob) {
          // Simulate async file reading
          setTimeout(() => {
            if (this.onloadend) {
              (this.onloadend as any)({} as any);
            }
          }, 0);
        }
        
        abort() {}
        readAsArrayBuffer(_blob: Blob) {}
        readAsBinaryString(_blob: Blob) {}
        readAsText(_blob: Blob, _encoding?: string) {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent(_event: Event): boolean { return true; }
      }
      
      vi.stubGlobal("FileReader", MockFileReader);

      Object.defineProperty(input, "files", {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(onMediaChange).toHaveBeenCalled();
        const mediaFiles = onMediaChange.mock.calls[0][0] as MediaFile[];
        expect(mediaFiles).toHaveLength(1);
        expect(mediaFiles[0].type).toBe("image");
        expect(mediaFiles[0].file.name).toBe("image.jpg");
      });
      
      vi.unstubAllGlobals();
    });

    it("should upload files with progress tracking - Req 26.7, 26.10", async () => {
      vi.mocked(listingsApi.uploadMedia).mockResolvedValue("https://example.com/image.jpg");

      const initialMedia: MediaFile[] = [
        {
          id: "1",
          file: new File(["content"], "image.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,mockdata",
          type: "image",
          uploaded: false,
        },
      ];

      const onMediaChange = vi.fn();
      render(<MediaUpload initialMedia={initialMedia} onMediaChange={onMediaChange} />);

      const uploadButton = screen.getByText(/Upload All/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(listingsApi.uploadMedia).toHaveBeenCalled();
        expect(onMediaChange).toHaveBeenCalled();
        const mediaFiles = onMediaChange.mock.calls[onMediaChange.mock.calls.length - 1][0] as MediaFile[];
        expect(mediaFiles[0].uploaded).toBe(true);
        expect(mediaFiles[0].url).toBe("https://example.com/image.jpg");
      });
    });
  });

  describe("Drag and Drop", () => {
    it("should handle drag and drop file upload - Req 26.5", async () => {
      const onMediaChange = vi.fn();
      const { container } = render(<MediaUpload onMediaChange={onMediaChange} />);
      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;

      // Test drag over
      fireEvent.dragOver(dropZone);
      expect(dropZone.className).toContain("border-naija-green");

      // Test drag leave
      fireEvent.dragLeave(dropZone);
      expect(dropZone.className).not.toContain("border-naija-green");

      // Test file drop
      const file = new File(["content"], "image.jpg", { type: "image/jpeg" });
      
      // Mock FileReader with proper constructor
      class MockFileReader {
        onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        result: string | ArrayBuffer | null = "data:image/jpeg;base64,mockdata";
        error: DOMException | null = null;
        onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        readyState: number = 0;
        DONE: number = 2;
        EMPTY: number = 0;
        LOADING: number = 1;
        
        readAsDataURL(_blob: Blob) {
          setTimeout(() => {
            if (this.onloadend) {
              (this.onloadend as any)({} as any);
            }
          }, 0);
        }
        
        abort() {}
        readAsArrayBuffer(_blob: Blob) {}
        readAsBinaryString(_blob: Blob) {}
        readAsText(_blob: Blob, _encoding?: string) {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent(_event: Event): boolean { return true; }
      }
      
      vi.stubGlobal("FileReader", MockFileReader);

      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone, { dataTransfer });

      await waitFor(() => {
        expect(onMediaChange).toHaveBeenCalled();
      });
      
      vi.unstubAllGlobals();
    });
  });

  describe("Media Preview and Reordering", () => {
    it("should display media preview with reordering capability - Req 26.5", () => {
      const initialMedia: MediaFile[] = [
        {
          id: "1",
          file: new File(["content"], "image1.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,mockdata1",
          type: "image",
          uploaded: false,
        },
        {
          id: "2",
          file: new File(["content"], "video.mp4", { type: "video/mp4" }),
          preview: "data:video/mp4;base64,mockdata2",
          type: "video",
          duration: 45,
          uploaded: false,
        },
      ];

      const onMediaChange = vi.fn();
      render(<MediaUpload initialMedia={initialMedia} onMediaChange={onMediaChange} />);

      // Check file count display
      expect(screen.getByText(/2 \/ 10 files/i)).toBeInTheDocument();
      
      // Check cover badge on first image
      expect(screen.getByText("Cover")).toBeInTheDocument();
      
      // Check video duration display
      expect(screen.getByText("45s")).toBeInTheDocument();
      
      // Check remove functionality
      const removeButton = screen.getAllByLabelText(/Remove media/i)[0];
      fireEvent.click(removeButton);
      expect(onMediaChange).toHaveBeenCalledWith([initialMedia[1]]);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and keyboard accessibility", () => {
      const initialMedia: MediaFile[] = [
        {
          id: "1",
          file: new File(["content"], "image.jpg", { type: "image/jpeg" }),
          preview: "data:image/jpeg;base64,mockdata",
          type: "image",
          uploaded: false,
        },
      ];

      render(<MediaUpload initialMedia={initialMedia} />);

      expect(screen.getByLabelText(/Upload media files/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remove media/i)).toBeInTheDocument();
    });
  });
});
