import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  StaleContentWarning,
  useStaleContent,
} from "../stale-content-warning";
import { renderHook, act } from "@testing-library/react";

describe("StaleContentWarning", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not display warning for fresh content (less than 24 hours)", () => {
    const recentTimestamp = Date.now() - 12 * 60 * 60 * 1000; // 12 hours ago

    render(<StaleContentWarning timestamp={recentTimestamp} />);

    expect(
      screen.queryByText(/was cached.*ago and may be outdated/)
    ).not.toBeInTheDocument();
  });

  it("should display warning for stale content (more than 24 hours)", () => {
    const staleTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

    render(<StaleContentWarning timestamp={staleTimestamp} />);

    expect(
      screen.getByText(/was cached.*ago and may be outdated/)
    ).toBeInTheDocument();
  });

  it("should display age in days for content more than 24 hours old", () => {
    const timestamp = Date.now() - 36 * 60 * 60 * 1000; // 36 hours ago (1 day)

    render(<StaleContentWarning timestamp={timestamp} />);

    expect(screen.getByText(/1 day ago/)).toBeInTheDocument();
  });

  it("should display age in days for content more than 48 hours old", () => {
    const timestamp = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago

    render(<StaleContentWarning timestamp={timestamp} />);

    expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
  });

  it("should use custom content type in message", () => {
    const staleTimestamp = Date.now() - 25 * 60 * 60 * 1000;

    render(
      <StaleContentWarning timestamp={staleTimestamp} contentType="article" />
    );

    expect(screen.getByText(/This article was cached/)).toBeInTheDocument();
  });

  it("should update age every minute", () => {
    const initialTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago (1 day)

    const { rerender } = render(
      <StaleContentWarning timestamp={initialTimestamp} />
    );

    expect(screen.getByText(/1 day ago/)).toBeInTheDocument();

    // Advance time by 24 hours
    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    // Re-render to trigger useEffect
    rerender(<StaleContentWarning timestamp={initialTimestamp} />);

    // Wait for the interval to update
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    // Age should now be 2 days
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    const staleTimestamp = Date.now() - 25 * 60 * 60 * 1000;

    render(<StaleContentWarning timestamp={staleTimestamp} />);

    const warning = screen.getByRole("alert");
    expect(warning).toHaveAttribute("aria-live", "polite");
  });
});

describe("useStaleContent hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return isStale false for fresh content", () => {
    const recentTimestamp = Date.now() - 12 * 60 * 60 * 1000; // 12 hours ago

    const { result } = renderHook(() => useStaleContent(recentTimestamp));

    expect(result.current.isStale).toBe(false);
    expect(result.current.ageInHours).toBeLessThan(24);
  });

  it("should return isStale true for old content", () => {
    const staleTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

    const { result } = renderHook(() => useStaleContent(staleTimestamp));

    expect(result.current.isStale).toBe(true);
    expect(result.current.ageInHours).toBeGreaterThan(24);
  });

  it("should calculate age in days correctly", () => {
    const timestamp = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago

    const { result } = renderHook(() => useStaleContent(timestamp));

    expect(result.current.ageInDays).toBe(3);
    expect(result.current.ageInHours).toBeGreaterThanOrEqual(72);
  });

  it("should update values every minute", () => {
    const initialTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

    const { result } = renderHook(() => useStaleContent(initialTimestamp));

    const initialAge = result.current.ageInHours;

    // Advance time by 1 hour
    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });

    // Trigger interval check
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    // Age should have increased
    expect(result.current.ageInHours).toBeGreaterThan(initialAge);
  });
});
