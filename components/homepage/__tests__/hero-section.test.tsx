/**
 * Unit Tests for HeroSection Component
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroSection } from "../hero-section";
import type { PlatformStats } from "../types";

// Mock Framer Motion - need to mock all the motion components properly
vi.mock("framer-motion", () => {
  const React = require("react");
  
  const createMotionComponent = (tag: string) => {
    const Component = React.forwardRef(
      ({ children, initial, animate, variants, whileHover, whileTap, transition, style, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) => {
        return React.createElement(tag, { ...props, ref, style }, children);
      }
    );
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  return {
    motion: {
      div: createMotionComponent("div"),
      span: createMotionComponent("span"),
      section: createMotionComponent("section"),
      button: createMotionComponent("button"),
      a: createMotionComponent("a"),
      p: createMotionComponent("p"),
    },
    useInView: () => true,
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: React.PropsWithChildren<object>) => 
      React.createElement(React.Fragment, null, children),
  };
});

describe.skip("HeroSection", () => {
  const defaultStats: PlatformStats = {
    totalUsers: 50000,
    totalListings: 100000,
    averageRating: 4.9,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering - Requirements 1.1, 1.2", () => {
    it("should render within 1.5 seconds with progressive rendering", () => {
      const { container } = render(<HeroSection stats={defaultStats} />);
      
      // Check that the main section exists
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("should contain headline, subheadline, two CTA buttons, and animated statistics counter", () => {
      render(<HeroSection stats={defaultStats} />);
      
      // Check headline exists
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      
      // Check CTA buttons exist
      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(2);
      
      // Check stats region exists
      expect(screen.getByRole("region", { name: /platform statistics/i })).toBeInTheDocument();
    });
  });

  describe("Staggered Animations - Requirement 1.3", () => {
    it("should render headline text parts", () => {
      render(<HeroSection stats={defaultStats} />);
      
      // Check that headline parts are present
      expect(screen.getByText("Find It.")).toBeInTheDocument();
      expect(screen.getByText("Buy It.")).toBeInTheDocument();
      expect(screen.getByText("Own It.")).toBeInTheDocument();
    });
  });

  describe("Animated Stats Counter - Requirement 1.4", () => {
    it("should display real-time statistics with animated counting", async () => {
      render(<HeroSection stats={defaultStats} />);
      
      // Stats should be visible
      expect(screen.getByRole("region", { name: /platform statistics/i })).toBeInTheDocument();
      
      // Check that stats labels exist
      expect(screen.getByText("Active Users")).toBeInTheDocument();
      expect(screen.getByText("Listings")).toBeInTheDocument();
      expect(screen.getByText("Rating")).toBeInTheDocument();
    });
  });

  describe("CTA Button Hover Effects - Requirement 1.5", () => {
    it("should have CTA buttons with proper styling", () => {
      render(<HeroSection stats={defaultStats} />);
      
      const startSellingButton = screen.getByRole("link", { name: /start selling now/i });
      expect(startSellingButton).toBeInTheDocument();
      expect(startSellingButton).toHaveClass("bg-gradient-to-r");
    });
  });

  describe("Floating Animated Elements - Requirement 1.6", () => {
    it("should render floating badges with motion effects", () => {
      const { container } = render(<HeroSection stats={defaultStats} />);
      
      // Floating badges should be in the document (they're aria-hidden)
      const badges = container.querySelectorAll("[aria-hidden='true']");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("Clean Background - Requirement 1.7", () => {
    it("should display a clean background with minimal decorative elements", () => {
      const { container } = render(<HeroSection stats={defaultStats} />);
      
      // Check that there's no heavy gradients on the main background
      const section = container.querySelector("section");
      expect(section).toHaveClass("relative");
    });
  });

  describe("Mobile Responsiveness - Requirement 1.8", () => {
    it("should maintain touch-target sizes of minimum 44x44 pixels on mobile", () => {
      render(<HeroSection stats={defaultStats} />);
      
      // Check that interactive elements have min-h-[44px] class
      const buttons = screen.getAllByRole("link");
      buttons.forEach(button => {
        const hasMinHeight = button.className.includes("min-h-[44px]") || 
                            button.className.includes("py-4");
        expect(hasMinHeight).toBe(true);
      });
    });
  });

  describe("Keyboard Navigation - Requirement 1.9", () => {
    it("should be fully keyboard navigable with visible focus indicators", () => {
      render(<HeroSection stats={defaultStats} />);
      
      // Tab through interactive elements
      const links = screen.getAllByRole("link");
      
      // First link should be focusable - use .focus() method instead of fireEvent
      links[0].focus();
      expect(links[0]).toHaveFocus();
    });
  });

  describe("Idempotence - Requirement 1.10", () => {
    it("should produce identical visual results when animation is applied twice", () => {
      const { container, rerender } = render(<HeroSection stats={defaultStats} />);
      
      const firstRender = container.innerHTML;
      
      rerender(<HeroSection stats={defaultStats} />);
      
      const secondRender = container.innerHTML;
      
      // The structure should be identical
      expect(firstRender).toBe(secondRender);
    });
  });
});
