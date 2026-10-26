/**
 * EmptyState Component Tests
 * 
 * Tests the EmptyState component to ensure:
 * - Proper rendering of title, message, icon, and action button
 * - Accessibility compliance (ARIA attributes, screen reader support)
 * - Responsive design and styling
 * - Action button functionality
 * - Pre-configured variants work correctly
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState, EmptyStateVariants } from "../empty-state";
import { Search, AlertCircle, Package } from "lucide-react";

describe("EmptyState Component", () => {
  describe("Basic Rendering", () => {
    it("should render title and message correctly", () => {
      render(
        <EmptyState
          title="No Results Found"
          message="Try adjusting your search criteria"
        />
      );

      expect(screen.getByText("No Results Found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your search criteria")
      ).toBeInTheDocument();
    });

    it("should render with default icon when no icon provided", () => {
      const { container } = render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
        />
      );

      // Check for SVG icon (lucide-react icons render as SVG)
      const svgIcon = container.querySelector("svg");
      expect(svgIcon).toBeInTheDocument();
    });

    it("should render custom icon when provided", () => {
      render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          icon={<Search data-testid="custom-icon" className="w-12 h-12" />}
        />
      );

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("should not render action button when not provided", () => {
      render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
        />
      );

      // Button should not be present
      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });

    it("should render action button when provided", () => {
      const mockOnClick = vi.fn();

      render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          action={{
            label: "Clear Filters",
            onClick: mockOnClick,
          }}
        />
      );

      const button = screen.getByRole("button", { name: /clear filters/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Action Button Functionality", () => {
    it("should call onClick handler when action button is clicked", () => {
      const mockOnClick = vi.fn();

      render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          action={{
            label: "Retry",
            onClick: mockOnClick,
          }}
        />
      );

      const button = screen.getByRole("button", { name: /retry/i });
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple clicks correctly", () => {
      const mockOnClick = vi.fn();

      render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          action={{
            label: "Clear",
            onClick: mockOnClick,
          }}
        />
      );

      const button = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA role and attributes", () => {
      const { container } = render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
        />
      );

      const emptyStateContainer = container.querySelector('[role="status"]');
      expect(emptyStateContainer).toBeInTheDocument();
      expect(emptyStateContainer).toHaveAttribute("aria-live", "polite");
    });

    it("should have aria-hidden on icon to prevent screen reader duplication", () => {
      const { container } = render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          icon={<Search className="w-12 h-12" aria-hidden="true" />}
        />
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(
        <EmptyState
          title="No Results Found"
          message="Try again later"
        />
      );

      const heading = screen.getByRole("heading", { name: /no results found/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          className="custom-class"
        />
      );

      const emptyStateContainer = container.querySelector(".custom-class");
      expect(emptyStateContainer).toBeInTheDocument();
    });

    it("should maintain default classes when custom className is provided", () => {
      const { container } = render(
        <EmptyState
          title="No Results"
          message="Nothing to show"
          className="my-custom-class"
        />
      );

      const emptyStateContainer = container.querySelector('[role="status"]');
      expect(emptyStateContainer).toHaveClass("flex");
      expect(emptyStateContainer).toHaveClass("flex-col");
      expect(emptyStateContainer).toHaveClass("items-center");
      expect(emptyStateContainer).toHaveClass("my-custom-class");
    });
  });

  describe("EmptyState Variants", () => {
    describe("NoSearchResults", () => {
      it("should render with search term in message", () => {
        const mockOnClear = vi.fn();

        render(
          <EmptyStateVariants.NoSearchResults
            searchTerm="electronics"
            onClear={mockOnClear}
          />
        );

        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        expect(
          screen.getByText(/no categories match "electronics"/i)
        ).toBeInTheDocument();
      });

      it("should render without search term in message", () => {
        const mockOnClear = vi.fn();

        render(
          <EmptyStateVariants.NoSearchResults onClear={mockOnClear} />
        );

        expect(
          screen.getByText(/no categories match your search criteria/i)
        ).toBeInTheDocument();
      });

      it("should call onClear when Clear Search button is clicked", () => {
        const mockOnClear = vi.fn();

        render(
          <EmptyStateVariants.NoSearchResults onClear={mockOnClear} />
        );

        const button = screen.getByRole("button", { name: /clear search/i });
        fireEvent.click(button);

        expect(mockOnClear).toHaveBeenCalledTimes(1);
      });
    });

    describe("NoFilterResults", () => {
      it("should render filter-specific message", () => {
        const mockOnClear = vi.fn();

        render(<EmptyStateVariants.NoFilterResults onClear={mockOnClear} />);

        expect(
          screen.getByText(/no categories match your filters/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/try adjusting your filters/i)
        ).toBeInTheDocument();
      });

      it("should call onClear when Clear Filters button is clicked", () => {
        const mockOnClear = vi.fn();

        render(<EmptyStateVariants.NoFilterResults onClear={mockOnClear} />);

        const button = screen.getByRole("button", { name: /clear filters/i });
        fireEvent.click(button);

        expect(mockOnClear).toHaveBeenCalledTimes(1);
      });
    });

    describe("NoData", () => {
      it("should render with default entity name", () => {
        render(<EmptyStateVariants.NoData />);

        expect(screen.getByText(/no items available/i)).toBeInTheDocument();
      });

      it("should render with custom entity name", () => {
        render(<EmptyStateVariants.NoData entityName="categories" />);

        expect(
          screen.getByText(/no categories available/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/categories will appear here/i)
        ).toBeInTheDocument();
      });

      it("should capitalize entity name correctly", () => {
        render(<EmptyStateVariants.NoData entityName="products" />);

        expect(
          screen.getByText(/no products available/i)
        ).toBeInTheDocument();
      });

      it("should not render action button for NoData variant", () => {
        render(<EmptyStateVariants.NoData />);

        const button = screen.queryByRole("button");
        expect(button).not.toBeInTheDocument();
      });
    });

    describe("Error", () => {
      it("should render error message", () => {
        render(<EmptyStateVariants.Error />);

        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(
          screen.getByText(/we couldn't load the data/i)
        ).toBeInTheDocument();
      });

      it("should not render retry button when onRetry not provided", () => {
        render(<EmptyStateVariants.Error />);

        const button = screen.queryByRole("button");
        expect(button).not.toBeInTheDocument();
      });

      it("should render retry button when onRetry provided", () => {
        const mockOnRetry = vi.fn();

        render(<EmptyStateVariants.Error onRetry={mockOnRetry} />);

        const button = screen.getByRole("button", { name: /retry/i });
        expect(button).toBeInTheDocument();
      });

      it("should call onRetry when Retry button is clicked", () => {
        const mockOnRetry = vi.fn();

        render(<EmptyStateVariants.Error onRetry={mockOnRetry} />);

        const button = screen.getByRole("button", { name: /retry/i });
        fireEvent.click(button);

        expect(mockOnRetry).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Text Content", () => {
    it("should handle long titles without overflow", () => {
      const longTitle =
        "This is a very long title that should still display correctly without breaking the layout";

      render(<EmptyState title={longTitle} message="Short message" />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle long messages without overflow", () => {
      const longMessage =
        "This is a very long message that provides detailed information about why there are no results and what the user should do next to find what they're looking for";

      render(<EmptyState title="No Results" message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should render special characters in title and message", () => {
      render(
        <EmptyState
          title='No "Results" Found'
          message="Try using different search terms & filters"
        />
      );

      expect(screen.getByText(/no "results" found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/try using different search terms & filters/i)
      ).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should apply responsive text classes", () => {
      const { container } = render(
        <EmptyState title="No Results" message="Nothing to show" />
      );

      const title = screen.getByText("No Results");
      expect(title).toHaveClass("text-2xl");
      expect(title).toHaveClass("md:text-3xl");

      const message = screen.getByText("Nothing to show");
      expect(message).toHaveClass("text-base");
      expect(message).toHaveClass("md:text-lg");
    });

    it("should have proper spacing and padding classes", () => {
      const { container } = render(
        <EmptyState title="No Results" message="Nothing to show" />
      );

      const emptyStateContainer = container.querySelector('[role="status"]');
      expect(emptyStateContainer).toHaveClass("px-4");
      expect(emptyStateContainer).toHaveClass("py-12");
    });
  });
});
