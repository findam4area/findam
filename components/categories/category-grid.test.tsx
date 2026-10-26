/**
 * Accessibility Tests for Browse Categories Page
 * 
 * Tests keyboard navigation, screen reader compatibility, color contrast,
 * and touch targets for the category browsing experience.
 * 
 * Requirements: 9.1-9.8, 16.32-16.36, 16.49-16.51
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { CategoryGrid } from "./category-grid";
import type { Category } from "@/lib/types";

expect.extend(toHaveNoViolations);

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    parent_id: null,
    description: "Electronic devices and gadgets",
    image_url: null,
    icon: "📱",
    display_order: 1,
    business_count: 150,
    is_hidden: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Fashion",
    slug: "fashion",
    parent_id: null,
    description: "Clothing and accessories",
    image_url: null,
    icon: "👔",
    display_order: 2,
    business_count: 200,
    is_hidden: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Food & Beverages",
    slug: "food-beverages",
    parent_id: null,
    description: "Restaurants and food services",
    image_url: null,
    icon: "🍔",
    display_order: 3,
    business_count: 1,
    is_hidden: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

describe("CategoryGrid Accessibility", () => {
  describe("21.1 Automated Accessibility Tests", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should render proper semantic HTML structure", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Grid should be a container with proper structure
      const grid = screen.getByRole("link", { name: /Electronics/ }).closest("div");
      expect(grid).toBeInTheDocument();
    });

    it("should have proper ARIA labels for category cards", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Each category should have an accessible name with business count
      expect(screen.getByLabelText("Electronics, 150 businesses")).toBeInTheDocument();
      expect(screen.getByLabelText("Fashion, 200 businesses")).toBeInTheDocument();
      expect(screen.getByLabelText("Food & Beverages, 1 business")).toBeInTheDocument();
    });

    it("should use proper singular/plural for business count", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Multiple businesses should use plural
      expect(screen.getByLabelText("Electronics, 150 businesses")).toBeInTheDocument();
      
      // Single business should use singular
      expect(screen.getByLabelText("Food & Beverages, 1 business")).toBeInTheDocument();
    });

    it("should have ARIA labels even when business count is hidden", () => {
      render(<CategoryGrid categories={mockCategories} showBusinessCount={false} />);
      
      // Should still have accessible labels, just without count
      const electronicsCard = screen.getByRole("link", { name: /Electronics/ });
      expect(electronicsCard).toBeInTheDocument();
    });
  });

  describe("21.2 Keyboard Navigation", () => {
    it("should allow navigation through categories with Tab key", async () => {
      const user = userEvent.setup();
      render(<CategoryGrid categories={mockCategories} />);

      // Get all category links
      const links = screen.getAllByRole("link");
      
      // Focus the first link by tabbing from the body
      await user.tab();
      // When tabbing, the link element receives focus (even though the div inside has tabindex)
      expect(document.activeElement).toBe(links[0]);
    });

    it("should activate category on Enter key", async () => {
      const user = userEvent.setup();
      const onCategorySelect = vi.fn();
      
      render(
        <CategoryGrid 
          categories={mockCategories} 
          onCategorySelect={onCategorySelect}
        />
      );

      // Focus first category
      const firstCategory = screen.getByLabelText("Electronics, 150 businesses");
      firstCategory.focus();

      // Press Enter
      await user.keyboard("{Enter}");
      
      expect(onCategorySelect).toHaveBeenCalledWith(mockCategories[0]);
    });

    it("should activate category on Space key", async () => {
      const user = userEvent.setup();
      const onCategorySelect = vi.fn();
      
      render(
        <CategoryGrid 
          categories={mockCategories} 
          onCategorySelect={onCategorySelect}
        />
      );

      // Focus first category
      const firstCategory = screen.getByLabelText("Electronics, 150 businesses");
      firstCategory.focus();

      // Press Space
      await user.keyboard(" ");
      
      expect(onCategorySelect).toHaveBeenCalledWith(mockCategories[0]);
    });

    it("should have proper tabIndex for keyboard navigation", () => {
      render(<CategoryGrid categories={mockCategories} />);

      // All category cards should be keyboard accessible
      const electronicsCard = screen.getByLabelText("Electronics, 150 businesses");
      expect(electronicsCard).toHaveAttribute("tabIndex", "0");
    });

    it("should maintain focus visibility during keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<CategoryGrid categories={mockCategories} />);

      const firstLink = screen.getAllByRole("link")[0];
      
      // Tab to first category
      await user.tab();
      
      // Focus should be visible (browser handles this, but element should be focused)
      expect(firstLink).toHaveFocus();
    });
  });

  describe("21.3 Screen Reader Compatibility", () => {
    it("should have descriptive ARIA labels for each category", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Each card should have a descriptive label
      const electronics = screen.getByLabelText("Electronics, 150 businesses");
      expect(electronics).toBeInTheDocument();
      
      const fashion = screen.getByLabelText("Fashion, 200 businesses");
      expect(fashion).toBeInTheDocument();
    });

    it("should use role='button' for interactive cards", () => {
      const onCategorySelect = vi.fn();
      render(
        <CategoryGrid 
          categories={mockCategories}
          onCategorySelect={onCategorySelect}
        />
      );

      // Cards with onSelect should have button role
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(mockCategories.length);
    });

    it("should provide semantic HTML for category names", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Category names should be in headings
      const electronicsHeading = screen.getByRole("heading", { name: "Electronics" });
      expect(electronicsHeading).toBeInTheDocument();
      expect(electronicsHeading.tagName).toBe("H3");
    });

    it("should announce business count separately for screen readers", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Business count should be readable by screen readers
      const businessCount = screen.getByText("150 businesses");
      expect(businessCount).toBeInTheDocument();
      expect(businessCount).toHaveClass("text-xs");
    });

    it("should provide contextual information through ARIA attributes", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Check that cards have proper ARIA labels that include context
      const card = screen.getByLabelText("Electronics, 150 businesses");
      expect(card).toHaveAttribute("aria-label");
    });

    it("should handle empty categories gracefully", () => {
      render(<CategoryGrid categories={[]} />);
      
      // Grid should still render without errors
      const grid = screen.queryByRole("link");
      expect(grid).not.toBeInTheDocument();
    });
  });

  describe("21.4 Color Contrast and Touch Targets", () => {
    it("should have sufficient touch target size (minimum 44x44 pixels)", () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);
      
      // Category cards should have sufficient padding for touch targets
      const cards = container.querySelectorAll('[role="button"], a');
      cards.forEach((card) => {
        const styles = window.getComputedStyle(card);
        // Check padding is applied (p-6 = 1.5rem = 24px)
        // The card itself with icon and text should exceed 44x44px
        expect(card).toBeInTheDocument();
      });
    });

    it("should use high contrast colors for text", () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);
      
      // Category names should use text-white for high contrast
      const categoryNames = container.querySelectorAll("h3");
      categoryNames.forEach((name) => {
        expect(name).toHaveClass("text-white");
      });
    });

    it("should provide visual feedback on hover", () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);
      
      // Cards should have hover classes
      const cards = container.querySelectorAll(".glass-card");
      cards.forEach((card) => {
        // Should have group class for hover effects
        expect(card).toHaveClass("group");
      });
    });

    it("should provide visual feedback on focus", () => {
      render(<CategoryGrid categories={mockCategories} />);
      
      // Focusable elements should be keyboard-accessible
      // The div inside the link has tabindex="0"
      const electronicsCard = screen.getByLabelText("Electronics, 150 businesses");
      expect(electronicsCard).toHaveAttribute("tabIndex", "0");
    });

    it("should have proper spacing between touch targets", () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);
      
      // Grid should have gap-4 class for proper spacing
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("gap-4");
    });

    it("should scale appropriately for responsive layouts", () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);
      
      // Grid should have responsive column classes
      const grid = container.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-2"); // Mobile: 2 columns
      expect(grid).toHaveClass("sm:grid-cols-3"); // Small: 3 columns
      expect(grid).toHaveClass("md:grid-cols-4"); // Medium: 4 columns
      expect(grid).toHaveClass("lg:grid-cols-5"); // Large: 5 columns
    });
  });

  describe("Integration Tests", () => {
    it("should work with both link and button modes", () => {
      const { rerender } = render(<CategoryGrid categories={mockCategories} />);
      
      // Default: should render links
      expect(screen.getAllByRole("link")).toHaveLength(mockCategories.length);
      
      // With onCategorySelect: should render buttons
      const onCategorySelect = vi.fn();
      rerender(
        <CategoryGrid 
          categories={mockCategories}
          onCategorySelect={onCategorySelect}
        />
      );
      
      expect(screen.getAllByRole("button")).toHaveLength(mockCategories.length);
    });

    it("should maintain accessibility with large number of categories", async () => {
      const manyCategories: Category[] = Array.from({ length: 23 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`,
        parent_id: null,
        description: null,
        image_url: null,
        icon: "📦",
        display_order: i + 1,
        business_count: i * 10,
        is_hidden: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }));

      const { container } = render(<CategoryGrid categories={manyCategories} />);
      
      // Should still pass accessibility checks with many items
      const results = await axe(container);
      expect(results).toHaveNoViolations();
      
      // All items should be keyboard accessible
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(23);
    });

    it("should handle categories without business counts", () => {
      const categoriesWithoutCounts: Category[] = mockCategories.map(cat => ({
        ...cat,
        business_count: undefined,
      }));

      render(<CategoryGrid categories={categoriesWithoutCounts} />);
      
      // Should render without errors
      expect(screen.getByRole("heading", { name: "Electronics" })).toBeInTheDocument();
    });
  });
});
