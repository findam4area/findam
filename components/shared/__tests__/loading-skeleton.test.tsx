import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSkeleton } from "../loading-skeleton";

describe("LoadingSkeleton", () => {
  it("renders default number of skeleton cards (8)", () => {
    const { container } = render(<LoadingSkeleton />);
    
    // Count skeleton cards by finding elements with shimmer animation
    const skeletonCards = container.querySelectorAll('[role="status"] > div');
    expect(skeletonCards).toHaveLength(8);
  });

  it("renders custom count of skeleton cards", () => {
    const { container } = render(<LoadingSkeleton count={4} />);
    
    const skeletonCards = container.querySelectorAll('[role="status"] > div');
    expect(skeletonCards).toHaveLength(4);
  });

  it("applies grid layout by default", () => {
    const { container } = render(<LoadingSkeleton />);
    
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toHaveClass("grid");
    expect(wrapper).toHaveClass("grid-cols-1");
    expect(wrapper).toHaveClass("sm:grid-cols-2");
    expect(wrapper).toHaveClass("lg:grid-cols-3");
    expect(wrapper).toHaveClass("xl:grid-cols-4");
  });

  it("applies list layout when specified", () => {
    const { container } = render(<LoadingSkeleton layout="list" />);
    
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toHaveClass("flex");
    expect(wrapper).toHaveClass("flex-col");
    expect(wrapper).not.toHaveClass("grid");
  });

  it("applies custom className", () => {
    const { container } = render(<LoadingSkeleton className="custom-class" />);
    
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toHaveClass("custom-class");
  });

  it("has proper accessibility attributes", () => {
    render(<LoadingSkeleton />);
    
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveAttribute("aria-live", "polite");
    expect(skeleton).toHaveAttribute("aria-label", "Loading categories");
  });

  it("renders correct skeleton structure for grid layout", () => {
    const { container } = render(<LoadingSkeleton count={1} layout="grid" />);
    
    // Check for aspect ratio container (image skeleton)
    const imageContainer = container.querySelector(".aspect-\\[4\\/3\\]");
    expect(imageContainer).toBeInTheDocument();
    
    // Check for badge skeleton
    const badge = container.querySelector(".top-3.right-3");
    expect(badge).toBeInTheDocument();
  });

  it("renders correct skeleton structure for list layout", () => {
    const { container } = render(<LoadingSkeleton count={1} layout="list" />);
    
    // Check for flex layout
    const listItem = container.querySelector(".flex.gap-4");
    expect(listItem).toBeInTheDocument();
    
    // Check for fixed width image in list
    const image = container.querySelector(".w-32.h-24");
    expect(image).toBeInTheDocument();
  });

  it("includes shimmer animation elements", () => {
    const { container } = render(<LoadingSkeleton count={1} />);
    
    // Check for shimmer-effect class
    const shimmerElements = container.querySelectorAll(".shimmer-effect");
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it("renders with gray-800 background as specified", () => {
    const { container } = render(<LoadingSkeleton count={1} />);
    
    // Check for gray-800 backgrounds in skeleton elements
    const grayBgElements = container.querySelectorAll(".bg-gray-800");
    expect(grayBgElements.length).toBeGreaterThan(0);
  });

  it("renders all skeleton parts for grid layout", () => {
    const { container } = render(<LoadingSkeleton count={1} layout="grid" />);
    
    // Image skeleton
    const imageContainer = container.querySelector(".aspect-\\[4\\/3\\]");
    expect(imageContainer).toBeInTheDocument();
    
    // Content section
    const contentSection = container.querySelector(".p-4.space-y-3");
    expect(contentSection).toBeInTheDocument();
    
    // Bottom gradient
    const bottomGradient = container.querySelector(".bottom-0.left-0.right-0.h-1");
    expect(bottomGradient).toBeInTheDocument();
  });

  it("handles zero count gracefully", () => {
    const { container } = render(<LoadingSkeleton count={0} />);
    
    const skeletonCards = container.querySelectorAll('[role="status"] > div');
    expect(skeletonCards).toHaveLength(0);
  });

  it("handles large count without errors", () => {
    const { container } = render(<LoadingSkeleton count={50} />);
    
    const skeletonCards = container.querySelectorAll('[role="status"] > div');
    expect(skeletonCards).toHaveLength(50);
  });
});
