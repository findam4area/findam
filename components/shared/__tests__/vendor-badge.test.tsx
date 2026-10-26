/**
 * VendorBadge Component Tests
 * 
 * Tests for the VendorBadge component that displays approved vendor status.
 * Requirements: 4.5
 * Task: 8.13
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VendorBadge } from "../vendor-badge";

describe("VendorBadge", () => {
  describe("Rendering - Requirement 4.5", () => {
    it("should render with default props", () => {
      const { container } = render(<VendorBadge />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it("should display checkmark icon", () => {
      const { container } = render(<VendorBadge />);
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should display 'Verified Vendor' text by default", () => {
      render(<VendorBadge />);
      expect(screen.getByText("Verified Vendor")).toBeInTheDocument();
    });

    it("should have accessible aria-label", () => {
      const { container } = render(<VendorBadge />);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveAttribute("aria-label", "Verified Vendor");
    });
  });

  describe("Label visibility", () => {
    it("should show label when showLabel is true", () => {
      render(<VendorBadge showLabel={true} />);
      expect(screen.getByText("Verified Vendor")).toBeInTheDocument();
    });

    it("should hide label when showLabel is false", () => {
      render(<VendorBadge showLabel={false} />);
      expect(screen.queryByText("Verified Vendor")).not.toBeInTheDocument();
    });
  });

  describe("Size variants - Responsive Design", () => {
    it("should apply small size classes", () => {
      const { container } = render(<VendorBadge size="sm" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-3.5", "w-3.5");
    });

    it("should apply medium size classes by default", () => {
      const { container } = render(<VendorBadge />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-4", "w-4");
    });

    it("should apply large size classes", () => {
      const { container } = render(<VendorBadge size="lg" />);
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("h-5", "w-5");
    });
  });

  describe("Tooltip - Requirement 4.5", () => {
    it("should render tooltip element", () => {
      const { container } = render(<VendorBadge />);
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
    });

    it("should display tooltip heading", () => {
      render(<VendorBadge />);
      const tooltips = screen.getAllByText("Verified Vendor");
      // Should have at least 2: one in badge, one in tooltip
      expect(tooltips.length).toBeGreaterThanOrEqual(2);
    });

    it("should display tooltip explanation text", () => {
      render(<VendorBadge />);
      expect(
        screen.getByText(/This vendor has been manually approved/i),
      ).toBeInTheDocument();
    });

    it("should have tooltip arrow element", () => {
      const { container } = render(<VendorBadge />);
      // Check for arrow div inside tooltip
      const tooltip = container.querySelector('[role="tooltip"]');
      const arrow = tooltip?.querySelector('[aria-hidden="true"]');
      expect(arrow).toBeInTheDocument();
    });
  });

  describe("Styling - Accessibility", () => {
    it("should have naija-green color classes", () => {
      const { container } = render(<VendorBadge />);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass("text-naija-green");
    });

    it("should have background with opacity", () => {
      const { container } = render(<VendorBadge />);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass("bg-naija-green/10");
    });

    it("should have hover effects", () => {
      const { container } = render(<VendorBadge />);
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass("hover:bg-naija-green/20");
    });

    it("should have minimum touch target height on mobile", () => {
      const { container } = render(<VendorBadge />);
      const badge = container.querySelector('[role="status"]');
      // Check for min-h-[44px] class for mobile accessibility
      expect(badge).toHaveClass("min-h-[44px]");
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <VendorBadge className="custom-class" />,
      );
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass("custom-class");
    });

    it("should merge custom className with default classes", () => {
      const { container } = render(
        <VendorBadge className="custom-class" />,
      );
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass("custom-class");
      expect(badge).toHaveClass("text-naija-green");
    });
  });
});
