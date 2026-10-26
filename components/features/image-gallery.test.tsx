/**
 * Test suite for ImageGallery component
 * 
 * Tests:
 * - Renders main image and thumbnails correctly
 * - Switches images on thumbnail click
 * - Opens fullscreen viewer on main image click
 * - Closes fullscreen on Escape key
 * - Navigates with arrow keys in fullscreen
 * - Shows primary badge on primary image
 * - Handles empty images array
 * 
 * Requirements: 13.11, 17.2, 17.3, 17.4, 17.5, 17.8, 17.11
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageGallery, ImageGalleryImage } from "./image-gallery";

describe("ImageGallery", () => {
  const mockImages: ImageGalleryImage[] = [
    { url: "/test-image-1.jpg", alt: "Test Image 1" },
    { url: "/test-image-2.jpg", alt: "Test Image 2" },
    { url: "/test-image-3.jpg", alt: "Test Image 3" },
    { url: "/test-image-4.jpg", alt: "Test Image 4" },
  ];

  beforeEach(() => {
    // Mock body overflow style
    document.body.style.overflow = "";
  });

  afterEach(() => {
    // Clean up
    document.body.style.overflow = "";
  });

  it("renders main image with primary image by default", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Main image should be present
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    expect(mainImage).toBeInTheDocument();
  });

  it("displays thumbnail strip for multiple images", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Should have 4 thumbnails
    const thumbnails = screen.getAllByRole("button", { name: /view image \d/i });
    expect(thumbnails).toHaveLength(4);
  });

  it("shows Primary badge on primary image thumbnail", () => {
    render(<ImageGallery images={mockImages} primaryIndex={1} alt="Test Listing" />);
    
    // Primary badge should be visible
    const primaryBadge = screen.getByText("Primary");
    expect(primaryBadge).toBeInTheDocument();
  });

  it("highlights current image thumbnail with ring border", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // First thumbnail should have current styling
    const firstThumbnail = screen.getByRole("button", { name: "View image 1" });
    expect(firstThumbnail).toHaveAttribute("aria-current", "true");
  });

  it("switches main image when thumbnail is clicked", async () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Click on second thumbnail
    const secondThumbnail = screen.getByRole("button", { name: "View image 2" });
    fireEvent.click(secondThumbnail);
    
    await waitFor(() => {
      expect(secondThumbnail).toHaveAttribute("aria-current", "true");
    });
  });

  it("opens fullscreen modal viewer on main image click", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Click main image to open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Close button should appear
    const closeButton = screen.getByRole("button", { name: /close fullscreen viewer/i });
    expect(closeButton).toBeInTheDocument();
    
    // Body overflow should be hidden
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes fullscreen on Escape key press", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Press Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    
    // Close button should be gone
    const closeButton = screen.queryByRole("button", { name: /close fullscreen viewer/i });
    expect(closeButton).not.toBeInTheDocument();
    
    // Body overflow should be restored
    expect(document.body.style.overflow).toBe("");
  });

  it("navigates to next image with ArrowRight key in fullscreen", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Press ArrowRight key
    fireEvent.keyDown(window, { key: "ArrowRight" });
    
    // Counter should show 2 / 4 (there will be 2 counters when fullscreen is open)
    const counters = screen.getAllByText("2 / 4");
    expect(counters.length).toBeGreaterThan(0);
  });

  it("navigates to previous image with ArrowLeft key in fullscreen", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Press ArrowLeft key (should wrap to last image)
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    
    // Counter should show 4 / 4 (there will be 2 counters when fullscreen is open)
    const counters = screen.getAllByText("4 / 4");
    expect(counters.length).toBeGreaterThan(0);
  });

  it("shows navigation arrows in fullscreen mode", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Navigation arrows should be present
    const prevButtons = screen.getAllByRole("button", { name: /previous image/i });
    const nextButtons = screen.getAllByRole("button", { name: /next image/i });
    
    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it("navigates images using Next button", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Click next button
    const nextButtons = screen.getAllByRole("button", { name: /next image/i });
    fireEvent.click(nextButtons[0]);
    
    // Counter should show 2 / 4 (there will be 2 counters when fullscreen is open)
    const counters = screen.getAllByText("2 / 4");
    expect(counters.length).toBeGreaterThan(0);
  });

  it("navigates images using Previous button", () => {
    render(<ImageGallery images={mockImages} primaryIndex={1} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 2 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Click previous button
    const prevButtons = screen.getAllByRole("button", { name: /previous image/i });
    fireEvent.click(prevButtons[0]);
    
    // Counter should show 1 / 4 (there will be 2 counters when fullscreen is open)
    const counters = screen.getAllByText("1 / 4");
    expect(counters.length).toBeGreaterThan(0);
  });

  it("displays image counter", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Counter should show 1 / 4
    const counter = screen.getByText("1 / 4");
    expect(counter).toBeInTheDocument();
  });

  it("handles empty images array gracefully", () => {
    render(<ImageGallery images={[]} primaryIndex={0} alt="Test Listing" />);
    
    // Should show no images message
    const message = screen.getByText(/no images available/i);
    expect(message).toBeInTheDocument();
  });

  it("does not show thumbnails for single image", () => {
    const singleImage = [mockImages[0]];
    render(<ImageGallery images={singleImage} primaryIndex={0} alt="Test Listing" />);
    
    // Should not have thumbnail buttons (only main image button)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1); // Only the main image button
  });

  it("wraps to first image when navigating past last image", () => {
    render(<ImageGallery images={mockImages} primaryIndex={3} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 4 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Press ArrowRight key to wrap
    fireEvent.keyDown(window, { key: "ArrowRight" });
    
    // Counter should show 1 / 4 (there will be 2 counters when fullscreen is open)
    const counters = screen.getAllByText("1 / 4");
    expect(counters.length).toBeGreaterThan(0);
  });

  it("applies mobile-first responsive classes", () => {
    const { container } = render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Thumbnail grid should have responsive classes
    const thumbnailGrid = container.querySelector(".grid");
    expect(thumbnailGrid).toHaveClass("grid-cols-3", "sm:grid-cols-4", "md:grid-cols-5");
  });

  it("closes fullscreen when clicking outside image", () => {
    render(<ImageGallery images={mockImages} primaryIndex={0} alt="Test Listing" />);
    
    // Open fullscreen
    const mainImage = screen.getByRole("button", { name: /view test image 1 in fullscreen/i });
    fireEvent.click(mainImage);
    
    // Click the overlay (parent div with fixed positioning)
    const overlay = screen.getByRole("button", { name: /close fullscreen viewer/i }).closest(".fixed");
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    // Close button should be gone
    const closeButton = screen.queryByRole("button", { name: /close fullscreen viewer/i });
    expect(closeButton).not.toBeInTheDocument();
  });
});
