/**
 * Unit Tests for Stale Content Warning Component
 * Tests stale content detection and warning display
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaleContentWarning, StaleBadge, useStaleContent } from "../stale-content-warning";
import { renderHook, act } from "@testing-library/react";

describe("StaleContentWarning", () => {
  it("should not display warning for fresh content (< 24 hours)", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000; // 1 hour ago

    const { container } = render(
      <StaleContentWarning timestamp={oneHourAgo} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should display warning for stale content (> 24 hours)", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000; // 2 days ago

    render(<StaleContentWarning timestamp={twoDaysAgo} />);

    expect(screen.getByText(/This content may be outdated/i)).toBeInTheDocument();
  });

  it("should display correct age for stale content in days", () => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000; // 3 days ago

    render(<StaleContentWarning timestamp={threeDaysAgo} />);

    expect(screen.getByText(/3 days ago/i)).toBeInTheDocument();
  });

  it("should display correct age for stale content in hours (25-47 hours)", () => {
    const now = Date.now();
    const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000; // 25 hours ago

    render(<StaleContentWarning timestamp={twentyFiveHoursAgo} />);

    // 25 hours is displayed as "1 day ago" since it's over 24 hours
    expect(screen.getByText(/1 day ago/i)).toBeInTheDocument();
  });

  it("should call onRefresh when refresh button is clicked", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const onRefresh = vi.fn();

    render(
      <StaleContentWarning timestamp={twoDaysAgo} onRefresh={onRefresh} />
    );

    const refreshButton = screen.getByLabelText(/refresh content/i);
    refreshButton.click();

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("should not render refresh button when onRefresh is not provided", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    render(<StaleContentWarning timestamp={twoDaysAgo} />);

    expect(screen.queryByLabelText(/refresh content/i)).not.toBeInTheDocument();
  });

  it("should have proper ARIA attributes for accessibility", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    render(<StaleContentWarning timestamp={twoDaysAgo} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("should update stale status when timestamp changes", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const { rerender, container } = render(
      <StaleContentWarning timestamp={oneHourAgo} />
    );

    // Initially not stale
    expect(container.firstChild).toBeNull();

    // Update to stale timestamp
    rerender(<StaleContentWarning timestamp={twoDaysAgo} />);

    expect(screen.getByText(/This content may be outdated/i)).toBeInTheDocument();
  });
});

describe("StaleBadge", () => {
  it("should not display badge for fresh content", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const { container } = render(<StaleBadge timestamp={oneHourAgo} />);

    expect(container.firstChild).toBeNull();
  });

  it("should display badge for stale content", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    render(<StaleBadge timestamp={twoDaysAgo} />);

    expect(screen.getByText(/May be outdated/i)).toBeInTheDocument();
  });

  it("should have proper ARIA label", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    render(<StaleBadge timestamp={twoDaysAgo} />);

    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", "Content may be outdated");
  });
});

describe("useStaleContent hook", () => {
  it("should return isStale=false for fresh content", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const { result } = renderHook(() => useStaleContent(oneHourAgo));

    expect(result.current.isStale).toBe(false);
    expect(result.current.ageInHours).toBeLessThan(24);
  });

  it("should return isStale=true for stale content", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const { result } = renderHook(() => useStaleContent(twoDaysAgo));

    expect(result.current.isStale).toBe(true);
    expect(result.current.ageInHours).toBeGreaterThan(24);
  });

  it("should calculate correct age in hours", () => {
    const now = Date.now();
    const thirtyHoursAgo = now - 30 * 60 * 60 * 1000;

    const { result } = renderHook(() => useStaleContent(thirtyHoursAgo));

    expect(result.current.ageInHours).toBeCloseTo(30, 0);
  });

  it("should update when timestamp changes", () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const { result, rerender } = renderHook(
      ({ timestamp }) => useStaleContent(timestamp),
      { initialProps: { timestamp: oneHourAgo } }
    );

    expect(result.current.isStale).toBe(false);

    rerender({ timestamp: twoDaysAgo });

    expect(result.current.isStale).toBe(true);
  });
});

describe("Stale Content Edge Cases", () => {
  it("should handle exactly 24 hours boundary", () => {
    const now = Date.now();
    const exactlyTwentyFourHours = now - 24 * 60 * 60 * 1000;

    render(
      <StaleContentWarning timestamp={exactlyTwentyFourHours} />
    );

    // At exactly 24 hours, the component shows stale warning (>= 24 hours)
    expect(screen.getByText(/This content may be outdated/i)).toBeInTheDocument();
  });

  it("should handle just over 24 hours", () => {
    const now = Date.now();
    const justOverTwentyFourHours = now - (24 * 60 * 60 * 1000 + 1000); // 24 hours + 1 second

    render(<StaleContentWarning timestamp={justOverTwentyFourHours} />);

    expect(screen.getByText(/This content may be outdated/i)).toBeInTheDocument();
  });

  it("should handle very old content (30+ days)", () => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    render(<StaleContentWarning timestamp={thirtyDaysAgo} />);

    expect(screen.getByText(/30 days ago/i)).toBeInTheDocument();
  });

  it("should handle future timestamps gracefully", () => {
    const now = Date.now();
    const futureTimestamp = now + 60 * 60 * 1000; // 1 hour in the future

    const { container } = render(
      <StaleContentWarning timestamp={futureTimestamp} />
    );

    // Future timestamps should not be considered stale
    expect(container.firstChild).toBeNull();
  });
});
