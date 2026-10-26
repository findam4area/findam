/**
 * Unit Tests for VerificationBadge Component
 * Requirements: 4.3, 4.9
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerificationBadge } from "../verification-badge";

describe("VerificationBadge", () => {
  describe("Badge Types - Requirement 4.3", () => {
    it("should render phone verification badge", () => {
      render(<VerificationBadge type="phone" />);
      expect(screen.getByRole("status", { name: /phone verified/i })).toBeInTheDocument();
      expect(screen.getByText("PHONE")).toBeInTheDocument();
    });

    it("should render NIN verification badge", () => {
      render(<VerificationBadge type="nin" />);
      expect(screen.getByRole("status", { name: /nin verified/i })).toBeInTheDocument();
      expect(screen.getByText("NIN")).toBeInTheDocument();
    });

    it("should render video verification badge", () => {
      render(<VerificationBadge type="video" />);
      expect(screen.getByRole("status", { name: /video verified/i })).toBeInTheDocument();
      expect(screen.getByText("VIDEO")).toBeInTheDocument();
    });

    it("should render full verification badge", () => {
      render(<VerificationBadge type="full" />);
      expect(screen.getByRole("status", { name: /fully verified/i })).toBeInTheDocument();
      expect(screen.getByText("Verified")).toBeInTheDocument();
    });
  });

  describe("Tooltips - Requirement 4.9", () => {
    it("should display tooltip by default", () => {
      const { container } = render(<VerificationBadge type="phone" />);
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent("Phone number verified via SMS");
    });

    it("should hide tooltip when showTooltip is false", () => {
      const { container } = render(<VerificationBadge type="phone" showTooltip={false} />);
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).not.toBeInTheDocument();
    });

    it("should show correct tooltip for NIN verification", () => {
      const { container } = render(<VerificationBadge type="nin" />);
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toHaveTextContent("National Identity Number verified");
    });

    it("should show correct tooltip for video verification", () => {
      const { container } = render(<VerificationBadge type="video" />);
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toHaveTextContent("Identity verified via video call");
    });

    it("should show correct tooltip for full verification", () => {
      const { container } = render(<VerificationBadge type="full" />);
      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toHaveTextContent("All verification methods completed");
    });
  });

  describe("Sizes - Requirement 4.9", () => {
    it("should render small size badge", () => {
      const { container } = render(<VerificationBadge type="phone" size="sm" />);
      const badge = container.querySelector(".px-2");
      expect(badge).toBeInTheDocument();
    });

    it("should render medium size badge (default)", () => {
      const { container } = render(<VerificationBadge type="phone" />);
      const badge = container.querySelector(".px-3");
      expect(badge).toBeInTheDocument();
    });

    it("should render large size badge", () => {
      const { container } = render(<VerificationBadge type="phone" size="lg" />);
      const badge = container.querySelector(".px-4");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <VerificationBadge type="phone" className="custom-class" />
      );
      const badge = container.querySelector(".custom-class");
      expect(badge).toBeInTheDocument();
    });

    it("should have appropriate color styling for each type", () => {
      const { container: phoneContainer } = render(<VerificationBadge type="phone" />);
      expect(phoneContainer.querySelector(".text-blue-500")).toBeInTheDocument();

      const { container: ninContainer } = render(<VerificationBadge type="nin" />);
      expect(ninContainer.querySelector(".text-green-500")).toBeInTheDocument();

      const { container: videoContainer } = render(<VerificationBadge type="video" />);
      expect(videoContainer.querySelector(".text-purple-500")).toBeInTheDocument();

      const { container: fullContainer } = render(<VerificationBadge type="full" />);
      expect(fullContainer.querySelector(".text-naija-green")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<VerificationBadge type="phone" />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Phone Verified");
    });

    it("should mark icons as aria-hidden", () => {
      const { container } = render(<VerificationBadge type="phone" />);
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
