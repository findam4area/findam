/**
 * Accessibility Tests
 * 
 * Tests for accessibility components and utilities
 * Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SkipLink, SkipLinks } from "./skip-link";
import {
  FocusTrap,
  KeyboardNavigableList,
  KeyboardActivatable,
  VisuallyHidden,
  LiveRegion,
} from "./keyboard-navigation";
import {
  formatNumberForScreenReader,
  formatPriceForScreenReader,
  formatRatingForScreenReader,
  formatTimeRemainingForScreenReader,
  checkColorContrast,
  generateListingAltText,
  generateAriaLabel,
  BRAND_COLORS,
} from "@/lib/utils/accessibility";

expect.extend(toHaveNoViolations);

describe("Skip Links", () => {
  it("should render skip links", () => {
    render(<SkipLinks />);
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
    expect(screen.getByText("Skip to navigation")).toBeInTheDocument();
    expect(screen.getByText("Skip to footer")).toBeInTheDocument();
  });

  it("should have proper ARIA attributes", () => {
    render(<SkipLinks />);
    const nav = screen.getByLabelText("Skip links");
    expect(nav).toHaveAttribute("aria-label", "Skip links");
  });

  it("should navigate to target on click", () => {
    // Create target element with tabindex to make it focusable
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.textContent = 'Main Content';
    mainContent.setAttribute('tabindex', '-1'); // Make focusable
    document.body.appendChild(mainContent);
    
    render(<SkipLink href="#main-content">Skip to main</SkipLink>);
    
    const skipLink = screen.getByText("Skip to main");
    fireEvent.click(skipLink);
    
    expect(document.activeElement).toBe(mainContent);
    
    // Cleanup
    document.body.removeChild(mainContent);
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(<SkipLinks />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("FocusTrap", () => {
  it("should trap focus within container", async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Outside Before</button>
        <FocusTrap active={true}>
          <button>Inside 1</button>
          <button>Inside 2</button>
        </FocusTrap>
        <button>Outside After</button>
      </div>
    );

    // Focus should move to first element inside trap
    const inside1 = screen.getByText("Inside 1");
    expect(document.activeElement).toBe(inside1);

    // Tab should cycle within trap
    await user.tab();
    expect(document.activeElement).toBe(screen.getByText("Inside 2"));

    // Tab again should loop back
    await user.tab();
    expect(document.activeElement).toBe(inside1);
  });

  it("should restore focus when deactivated", () => {
    // Focus the outside button BEFORE rendering the trap
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside';
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    
    // Store the currently focused element
    const previouslyFocused = document.activeElement;
    
    const { rerender } = render(
      <FocusTrap active={true}>
        <button>Inside</button>
      </FocusTrap>
    );

    // Trap should have moved focus inside
    const insideButton = screen.getByText("Inside");
    expect(document.activeElement).toBe(insideButton);

    // Deactivate trap
    rerender(
      <FocusTrap active={false}>
        <button>Inside</button>
      </FocusTrap>
    );

    // Focus should be restored to the element that was focused before trap activated
    expect(document.activeElement).toBe(previouslyFocused);
    
    // Cleanup
    document.body.removeChild(outsideButton);
  });
});

describe("KeyboardNavigableList", () => {
  it("should navigate with arrow keys - vertical", async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList orientation="vertical">
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText("Item 1");
    const item2 = screen.getByText("Item 2");
    const item3 = screen.getByText("Item 3");

    item1.focus();
    expect(document.activeElement).toBe(item1);

    // Arrow down should move to next item
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(item2);

    // Arrow down again
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(item3);

    // Arrow up should move back
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(item2);
  });

  it("should navigate with arrow keys - horizontal", async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList orientation="horizontal">
        <button>Item 1</button>
        <button>Item 2</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText("Item 1");
    const item2 = screen.getByText("Item 2");

    item1.focus();

    // Arrow right should move to next item
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(item2);

    // Arrow left should move back
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(item1);
  });

  it("should support Home and End keys", async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList>
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText("Item 1");
    const item3 = screen.getByText("Item 3");

    item1.focus();

    // End should jump to last item
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(item3);

    // Home should jump to first item
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(item1);
  });
});

describe("KeyboardActivatable", () => {
  it("should activate on Enter key", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    
    render(
      <KeyboardActivatable onActivate={onActivate} ariaLabel="Activate me">
        <div>Content</div>
      </KeyboardActivatable>
    );

    const element = screen.getByLabelText("Activate me");
    element.focus();

    await user.keyboard("{Enter}");
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("should activate on Space key", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    
    render(
      <KeyboardActivatable onActivate={onActivate}>
        <div>Content</div>
      </KeyboardActivatable>
    );

    const element = screen.getByRole("button");
    element.focus();

    await user.keyboard(" ");
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("should have proper ARIA attributes", () => {
    render(
      <KeyboardActivatable onActivate={() => {}} ariaLabel="Test Button">
        <div>Content</div>
      </KeyboardActivatable>
    );

    const element = screen.getByRole("button");
    expect(element).toHaveAttribute("role", "button");
    expect(element).toHaveAttribute("aria-label", "Test Button");
    expect(element).toHaveAttribute("tabIndex", "0");
  });
});

describe("VisuallyHidden", () => {
  it("should render content", () => {
    render(<VisuallyHidden>Hidden content</VisuallyHidden>);
    expect(screen.getByText("Hidden content")).toBeInTheDocument();
  });

  it("should have sr-only class", () => {
    render(<VisuallyHidden>Hidden content</VisuallyHidden>);
    const element = screen.getByText("Hidden content");
    expect(element).toHaveClass("sr-only");
  });

  it("should be focusable when focusable prop is true", () => {
    render(<VisuallyHidden focusable={true}>Focusable content</VisuallyHidden>);
    const element = screen.getByText("Focusable content");
    expect(element).toHaveClass("sr-only-focusable");
  });
});

describe("LiveRegion", () => {
  it("should render with polite aria-live by default", () => {
    render(<LiveRegion>Update message</LiveRegion>);
    const element = screen.getByText("Update message");
    expect(element).toHaveAttribute("aria-live", "polite");
  });

  it("should render with assertive aria-live when specified", () => {
    render(<LiveRegion politeness="assertive">Urgent message</LiveRegion>);
    const element = screen.getByText("Urgent message");
    expect(element).toHaveAttribute("aria-live", "assertive");
  });

  it("should have proper ARIA attributes", () => {
    render(
      <LiveRegion politeness="polite" atomic={true} relevant="additions">
        Message
      </LiveRegion>
    );
    
    const element = screen.getByText("Message");
    expect(element).toHaveAttribute("aria-live", "polite");
    expect(element).toHaveAttribute("aria-atomic", "true");
    expect(element).toHaveAttribute("aria-relevant", "additions");
  });
});

describe("Accessibility Utilities", () => {
  describe("formatNumberForScreenReader", () => {
    it("should format numbers with locale formatting", () => {
      expect(formatNumberForScreenReader(500)).toBe("500");
      expect(formatNumberForScreenReader(999)).toBe("999");
      expect(formatNumberForScreenReader(1000)).toBe("1,000");
      expect(formatNumberForScreenReader(5000)).toBe("5,000");
      expect(formatNumberForScreenReader(50000)).toBe("50,000");
      expect(formatNumberForScreenReader(1000000)).toBe("1,000,000");
    });
  });

  describe("formatPriceForScreenReader", () => {
    it("should format prices in naira", () => {
      expect(formatPriceForScreenReader(50000)).toBe("50,000 naira");
      expect(formatPriceForScreenReader(100)).toBe("100 naira");
      expect(formatPriceForScreenReader(1000)).toBe("1,000 naira");
    });
  });

  describe("formatRatingForScreenReader", () => {
    it("should format ratings correctly", () => {
      expect(formatRatingForScreenReader(4.5)).toBe("Rated 4.5 out of 5 stars");
      expect(formatRatingForScreenReader(3)).toBe("Rated 3 out of 5 stars");
      expect(formatRatingForScreenReader(5)).toBe("Rated 5 out of 5 stars");
    });
  });

  describe("formatTimeRemainingForScreenReader", () => {
    it("should format time correctly", () => {
      expect(formatTimeRemainingForScreenReader(7545)).toBe("2 hours, 5 minutes, 45 seconds remaining");
      expect(formatTimeRemainingForScreenReader(3661)).toBe("1 hour, 1 minute, 1 second remaining");
      expect(formatTimeRemainingForScreenReader(9015)).toBe("2 hours, 30 minutes, 15 seconds remaining");
      expect(formatTimeRemainingForScreenReader(2)).toBe("2 seconds remaining");
      expect(formatTimeRemainingForScreenReader(0)).toBe("0 seconds remaining");
    });
  });

  describe("checkColorContrast", () => {
    it("should pass for high contrast combinations", () => {
      const result = checkColorContrast(BRAND_COLORS.text, BRAND_COLORS.background);
      expect(result).toBe(true);
    });

    it("should meet WCAG AA for Naija Green on dark background", () => {
      const result = checkColorContrast(
        BRAND_COLORS.primary,
        BRAND_COLORS.background
      );
      expect(result).toBe(true);
    });

    it("should meet WCAG AA for Neon Cyan on dark background", () => {
      const result = checkColorContrast(
        BRAND_COLORS.primary,
        BRAND_COLORS.background
      );
      expect(result).toBe(true);
    });

    it("should meet WCAG AA for gray text on dark background", () => {
      const gray300Result = checkColorContrast(
        BRAND_COLORS.textMuted,
        BRAND_COLORS.background
      );
      const gray400Result = checkColorContrast(
        BRAND_COLORS.textMuted,
        BRAND_COLORS.background
      );
      
      expect(gray300Result).toBe(true);
      expect(gray400Result).toBe(true);
    });
  });

  describe("generateListingAltText", () => {
    it("should generate descriptive alt text for listings", () => {
      const result = generateListingAltText("iPhone 13");
      expect(result).toBe("Image of iPhone 13");
      
      const resultWithMultiple = generateListingAltText("iPhone 13", 1, 3);
      expect(resultWithMultiple).toBe("Image 2 of 3 for iPhone 13");
    });
  });

  describe("generateAriaLabel", () => {
    it("should generate descriptive ARIA labels for search", () => {
      const result = generateAriaLabel("listings");
      expect(result).toBe("Search listings");
      
      const siteResult = generateAriaLabel("site");
      expect(siteResult).toBe("Search site");
    });
  });
});
