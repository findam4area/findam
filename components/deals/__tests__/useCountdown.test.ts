/**
 * Unit tests for useCountdown hook
 * 
 * Requirements:
 * - 13.4: Display countdown timers for time-limited deals
 * - 13.9: Update timers every second for accurate countdown
 */

import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "../useCountdown";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should calculate time left correctly", () => {
    const futureDate = new Date(Date.now() + 3661000).toISOString(); // 1 hour, 1 minute, 1 second
    const { result } = renderHook(() => useCountdown(futureDate));

    expect(result.current.hours).toBe(1);
    expect(result.current.minutes).toBe(1);
    expect(result.current.seconds).toBe(1);
    expect(result.current.total).toBeGreaterThan(0);
  });

  it("should update countdown every second", () => {
    const futureDate = new Date(Date.now() + 5000).toISOString(); // 5 seconds
    const { result } = renderHook(() => useCountdown(futureDate));

    const initialSeconds = result.current.seconds;

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.seconds).toBe(initialSeconds - 1);
  });

  it("should stop countdown at zero", () => {
    const futureDate = new Date(Date.now() + 2000).toISOString(); // 2 seconds
    const { result } = renderHook(() => useCountdown(futureDate));

    // Advance time past expiration
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.total).toBe(0);
    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it("should handle expired dates", () => {
    const pastDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
    const { result } = renderHook(() => useCountdown(pastDate));

    expect(result.current.total).toBe(0);
    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it("should calculate days correctly for long countdowns", () => {
    const futureDate = new Date(Date.now() + 86400000 * 2.5).toISOString(); // 2.5 days
    const { result } = renderHook(() => useCountdown(futureDate));

    expect(result.current.days).toBe(2);
    expect(result.current.hours).toBe(12);
  });

  it("should cleanup interval on unmount", () => {
    const futureDate = new Date(Date.now() + 10000).toISOString();
    const { unmount } = renderHook(() => useCountdown(futureDate));

    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
