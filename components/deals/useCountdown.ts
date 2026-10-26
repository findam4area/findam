/**
 * useCountdown Hook
 * 
 * Custom hook for countdown timers with 1-second updates.
 * 
 * Requirements:
 * - 13.4: Display countdown timers for time-limited deals
 * - 13.9: Update timers every second for accurate countdown
 */

import { useState, useEffect } from "react";

export interface TimeLeft {
  total: number; // Total milliseconds remaining
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculate time remaining until expiration
 */
function calculateTimeLeft(expiresAt: string): TimeLeft {
  const difference = new Date(expiresAt).getTime() - Date.now();

  if (difference <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    total: difference,
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

/**
 * Hook for countdown timer with 1-second updates
 * 
 * @param expiresAt - ISO 8601 timestamp string
 * @returns TimeLeft object with days, hours, minutes, seconds
 */
export function useCountdown(expiresAt: string): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(expiresAt)
  );

  useEffect(() => {
    // Update immediately on mount
    const newTimeLeft = calculateTimeLeft(expiresAt);
    setTimeLeft(newTimeLeft);

    // Set up interval for 1-second updates (Requirement 13.9)
    const timer = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft(expiresAt);
      setTimeLeft(updatedTimeLeft);

      // Clear interval when countdown reaches zero (Requirement 13.5)
      if (updatedTimeLeft.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    // Cleanup on unmount or when expiresAt changes
    return () => {
      clearInterval(timer);
    };
  }, [expiresAt]);

  return timeLeft;
}
