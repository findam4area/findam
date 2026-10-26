/**
 * CategoryPreviewPopover Component Tests
 * 
 * Tests for hover preview popover functionality
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.7
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryPreviewPopover } from "../category-preview-popover";
import type { Category } from "@/lib/types/core";

// Sample category for testing
const mockCategory: Category = {
  id: "cat-1",
  name: "Electronics",
  slug: "electronics",
  parent_id: null,
  description: "Electronic devices and accessories",
  image_url: "https://example.com/electronics.jpg",
  display_order: 1,
  listing_count: 150,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-15T00:00:00Z",
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: "50px" }}>{children}</div>
);

// Simple delay helper for real timers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("CategoryPreviewPopover", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Component rendering", () => {
    it("renders the trigger element (children)", () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Hover me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });

    it("does not render popover on initial render", () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button>Hover me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      // Popover should not be visible initially
      const dialog = screen.queryByRole("dialog");
      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe("Hover behavior", () => {
    it("shows popover after 500ms hover delay", async () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Hover me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      const trigger = screen.getByTestId("trigger");
      
      // Hover over the trigger
      await user.hover(trigger);

      // Popover should not show immediately (need 500ms delay)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Wait for 500ms (real timer) - this is the hover delay
      await delay(500);

      // Now the popover should be visible
      expect(screen.queryByRole("dialog")).toBeInTheDocument();
    });

    it("hides popover after 200ms mouse leave", async () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Hover me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      const trigger = screen.getByTestId("trigger");
      
      // Hover to show popover
      await user.hover(trigger);
      await delay(500);
      
      // Verify popover is visible
      expect(screen.queryByRole("dialog")).toBeInTheDocument();

      // Unhover (mouse leave)
      await user.unhover(trigger);
      
      // Popover should not hide immediately (need 200ms delay)
      await delay(150);
      expect(screen.queryByRole("dialog")).toBeInTheDocument();

      // Wait for the full 200ms delay
      await delay(100);
      
      // Now the popover should be hidden
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard accessibility", () => {
    it("shows popover on focus", async () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Focus me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      const trigger = screen.getByTestId("trigger");
      await user.click(trigger);

      // Popover should appear on focus
      expect(screen.queryByRole("dialog")).toBeInTheDocument();
    });

    it("closes popover on Escape key press", async () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Focus me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      const trigger = screen.getByTestId("trigger");
      await user.click(trigger);

      // Verify popover is visible
      expect(screen.queryByRole("dialog")).toBeInTheDocument();

      // Press Escape
      await user.keyboard("{Escape}");

      // Popover should be hidden
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("has proper ARIA attributes when open", async () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Focus me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      const trigger = screen.getByTestId("trigger");
      await user.click(trigger);

      // Check ARIA attributes
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-label", `Preview for ${mockCategory.name}`);
      expect(dialog).toHaveAttribute("aria-modal", "false");
    });
  });

  describe("Desktop only behavior", () => {
    it("has hidden class for mobile (lg:block)", async () => {
      render(
        <TestWrapper>
          <CategoryPreviewPopover category={mockCategory}>
            <button data-testid="trigger">Hover me</button>
          </CategoryPreviewPopover>
        </TestWrapper>
      );

      const trigger = screen.getByTestId("trigger");
      await user.click(trigger);

      const dialog = screen.getByRole("dialog");
      // Verify the hidden lg:block class is present (for desktop only)
      expect(dialog).toHaveClass("hidden");
      expect(dialog).toHaveClass("lg:block");
    });
  });
});
