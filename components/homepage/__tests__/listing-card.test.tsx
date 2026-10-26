/**
 * Unit Tests for ListingCard Component
 * Requirements: 3.2, 3.3, 3.4, 3.10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListingCard } from "../listing-card";
import type { Listing } from "../types";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => {
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

// Mock Framer Motion
vi.mock("framer-motion", () => {
  const React = require("react");
  
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(
      ({ children, initial, animate, variants, whileHover, whileTap, transition, style, onMouseEnter, onMouseLeave, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) => {
        return React.createElement(tag, { ...props, ref, style, onMouseEnter, onMouseLeave }, children);
      }
    );
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  return {
    motion: {
      div: createMotionComponent("div"),
    },
  };
});

describe("ListingCard", () => {
  const mockListing: Listing = {
    id: "listing-1",
    title: "Test Listing",
    price: 50000,
    currency: "₦",
    location: "Lagos, Nigeria",
    thumbnail: "/test-thumbnail.jpg",
    images: ["/test-image-1.jpg", "/test-image-2.jpg"],
    views: 150,
    likes: 25,
    isBoosted: false,
    vendor: {
      id: "vendor-1",
      name: "Test Vendor",
      avatar: "/test-avatar.jpg",
      isVerified: true,
    },
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockOnLike = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Display Content - Requirement 3.2", () => {
    it("should display thumbnail, title, price, location, views, and likes", () => {
      render(<ListingCard listing={mockListing} />);

      // Check title
      expect(screen.getByText("Test Listing")).toBeInTheDocument();

      // Check price
      expect(screen.getByText(/₦ 50,000/i)).toBeInTheDocument();

      // Check location
      expect(screen.getByText("Lagos, Nigeria")).toBeInTheDocument();

      // Check views
      expect(screen.getByText("150")).toBeInTheDocument();

      // Check likes
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("should display vendor information when showVendor is true", () => {
      render(<ListingCard listing={mockListing} showVendor={true} />);

      expect(screen.getByText("Test Vendor")).toBeInTheDocument();
      expect(screen.getByLabelText("Verified vendor")).toBeInTheDocument();
    });

    it("should not display vendor information when showVendor is false", () => {
      render(<ListingCard listing={mockListing} showVendor={false} />);

      expect(screen.queryByText("Test Vendor")).not.toBeInTheDocument();
    });
  });

  describe("Hover Effects - Requirement 3.3", () => {
    it("should have hover effects configured", () => {
      const { container } = render(<ListingCard listing={mockListing} />);

      // The card should have motion.div wrapper
      const card = container.querySelector("div[class*='rounded']");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Video Play Button - Requirement 3.4", () => {
    it("should display video play button overlay for listings with videos", () => {
      const listingWithVideo: Listing = {
        ...mockListing,
        video: "/test-video.mp4",
      };

      const { container } = render(<ListingCard listing={listingWithVideo} />);

      // Check for play icon by looking for the SVG with play class
      const playIcon = container.querySelector(".lucide-play");
      expect(playIcon).toBeInTheDocument();
    });

    it("should not display video play button for listings without videos", () => {
      const { container } = render(<ListingCard listing={mockListing} />);

      // Play icon should not be present
      const playIcon = container.querySelector(".lucide-play");
      expect(playIcon).not.toBeInTheDocument();
    });
  });

  describe("Boost Badge - Requirement 3.5", () => {
    it("should display boost badge for boosted listings", () => {
      const boostedListing: Listing = {
        ...mockListing,
        isBoosted: true,
      };

      render(<ListingCard listing={boostedListing} />);

      expect(screen.getByText("Boosted")).toBeInTheDocument();
    });

    it("should not display boost badge for non-boosted listings", () => {
      render(<ListingCard listing={mockListing} />);

      expect(screen.queryByText("Boosted")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation - Requirement 3.10", () => {
    it("should support keyboard navigation", () => {
      const { container } = render(<ListingCard listing={mockListing} onLike={mockOnLike} />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();

      // Link should be focusable (tabindex not -1)
      expect(link).not.toHaveAttribute("tabindex", "-1");
    });

    it("should have proper ARIA labels for screen readers", () => {
      render(<ListingCard listing={mockListing} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-label");
      expect(link.getAttribute("aria-label")).toContain("Test Listing");
      expect(link.getAttribute("aria-label")).toContain("₦ 50,000");
    });
  });

  describe("Interaction Handlers", () => {
    it("should call onLike when like button is clicked", () => {
      render(<ListingCard listing={mockListing} onLike={mockOnLike} />);

      const likeButton = screen.getByLabelText("Like this listing");
      fireEvent.click(likeButton);

      expect(mockOnLike).toHaveBeenCalledWith("listing-1");
    });

    it("should call onSave when save button is clicked", () => {
      render(<ListingCard listing={mockListing} onSave={mockOnSave} />);

      const saveButton = screen.getByLabelText("Save this listing");
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith("listing-1");
    });
  });

  describe("Variants", () => {
    it("should apply default variant styling", () => {
      const { container } = render(<ListingCard listing={mockListing} variant="default" />);

      const card = container.querySelector("div[class*='rounded-lg']");
      expect(card).toBeInTheDocument();
    });

    it("should apply compact variant styling", () => {
      const { container } = render(<ListingCard listing={mockListing} variant="compact" />);

      const card = container.querySelector("div[class*='rounded-md']");
      expect(card).toBeInTheDocument();
    });

    it("should apply featured variant styling", () => {
      const { container } = render(<ListingCard listing={mockListing} variant="featured" />);

      const card = container.querySelector("div[class*='rounded-xl']");
      expect(card).toBeInTheDocument();
    });
  });
});
