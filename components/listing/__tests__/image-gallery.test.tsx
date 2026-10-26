/**
 * Unit tests for ImageGallery component
 * 
 * Tests cover:
 * - Gallery rendering with images and videos
 * - Thumbnail navigation
 * - Lightbox functionality
 * - Keyboard navigation
 * - Accessibility
 * 
 * Requirements: 26.3, 26.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageGallery, GalleryMedia } from "../image-gallery";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, priority, ...props }: any) => (
    <img src={src} alt={alt} data-fill={fill} data-priority={priority} {...props} />
  ),
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, initial, animate, exit, onClick, ...props }: any) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("ImageGallery", () => {
  const mockImageMedia: GalleryMedia[] = [
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
    {
      id: "3",
      url: "https://example.com/image3.jpg",
      type: "image",
    },
  ];

  const mockMixedMedia: GalleryMedia[] = [
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering and Navigation", () => {
    it("should render gallery with thumbnail navigation - Req 26.3", () => {
      render(<ImageGallery media={mockImageMedia} />);
      
      // Check main image display
      const mainImage = screen.getByAltText(/Gallery image 1/i);
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute("src", "https://example.com/image1.jpg");
      
      // Check thumbnail navigation
      const thumbnails = screen.getAllByAltText(/Thumbnail \d+/i);
      expect(thumbnails).toHaveLength(3);
      
      // Check media counter
      expect(screen.getByText(/1 \/ 3/i)).toBeInTheDocument();
    });

    it("should navigate between images with buttons and thumbnails - Req 26.3", () => {
      render(<ImageGallery media={mockImageMedia} />);
      
      // Navigate to next image
      const nextButton = screen.getByLabelText(/Next image/i);
      fireEvent.click(nextButton);
      
      const mainImage = screen.getByAltText(/Gallery image 2/i);
      expect(mainImage).toHaveAttribute("src", "https://example.com/image2.jpg");
      expect(screen.getByText(/2 \/ 3/i)).toBeInTheDocument();
      
      // Navigate via thumbnail
      const thumbnails = screen.getAllByRole("button", { name: /View image \d+/i });
      fireEvent.click(thumbnails[2]);
      
      const thirdImage = screen.getByAltText(/Gallery image 3/i);
      expect(thirdImage).toHaveAttribute("src", "https://example.com/image3.jpg");
    });

    it("should handle empty state gracefully", () => {
      render(<ImageGallery media={[]} />);
      expect(screen.getByText(/No media available/i)).toBeInTheDocument();
    });
  });

  describe("Lightbox", () => {
    it("should open and close lightbox with full functionality - Req 26.3", () => {
      render(<ImageGallery media={mockImageMedia} />);
      
      // Open lightbox
      const expandButton = screen.getByLabelText(/Open lightbox/i);
      fireEvent.click(expandButton);
      
      // Lightbox should be visible
      const lightboxImage = screen.getByAltText(/Lightbox image 1/i);
      expect(lightboxImage).toBeInTheDocument();
      
      // Navigate in lightbox
      const nextButtons = screen.getAllByLabelText(/Next image/i);
      const lightboxNextButton = nextButtons[nextButtons.length - 1];
      fireEvent.click(lightboxNextButton);
      
      // Should show second image
      const secondImage = screen.getByAltText(/Lightbox image 2/i);
      expect(secondImage).toHaveAttribute("src", "https://example.com/image2.jpg");
      
      // Close lightbox
      const closeButton = screen.getByLabelText(/Close lightbox/i);
      fireEvent.click(closeButton);
      
      // Lightbox should be closed
      expect(screen.queryByAltText(/Lightbox image 2/i)).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation in lightbox - Req 26.3", async () => {
      render(<ImageGallery media={mockImageMedia} />);
      
      // Open lightbox
      const expandButton = screen.getByLabelText(/Open lightbox/i);
      fireEvent.click(expandButton);
      
      // Navigate with ArrowRight
      fireEvent.keyDown(window, { key: "ArrowRight" });
      
      await waitFor(() => {
        const lightboxImage = screen.getByAltText(/Lightbox image 2/i);
        expect(lightboxImage).toBeInTheDocument();
      });
      
      // Close with Escape
      fireEvent.keyDown(window, { key: "Escape" });
      
      await waitFor(() => {
        expect(screen.queryByAltText(/Lightbox image 2/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Mixed Media Support", () => {
    it("should render both images and videos with thumbnails - Req 26.3", () => {
      render(<ImageGallery media={mockMixedMedia} />);
      
      // First item is an image
      const mainImage = screen.getByAltText(/Gallery image 1/i);
      expect(mainImage).toBeInTheDocument();
      
      // Navigate to video
      const nextButton = screen.getByLabelText(/Next image/i);
      fireEvent.click(nextButton);
      
      const video = document.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("controls");
      
      // Check video thumbnail
      const videoThumbnail = screen.getByAltText(/Video thumbnail 2/i);
      expect(videoThumbnail).toHaveAttribute("src", "https://example.com/thumb1.jpg");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and alt text", () => {
      render(<ImageGallery media={mockImageMedia} />);
      
      expect(screen.getByLabelText(/Previous image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Next image/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Open lightbox/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Gallery image 1/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Thumbnail 1/i)).toBeInTheDocument();
    });
  });
});

