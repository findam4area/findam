"use client";

import { useCallback } from "react";

export type HapticFeedbackType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

/**
 * Hook for providing haptic feedback on mobile devices
 * Uses the Vibration API for tactile feedback
 */
export function useHapticFeedback() {
  const isSupported = useCallback(() => {
    return typeof window !== "undefined" && "vibrate" in navigator;
  }, []);

  const triggerHaptic = useCallback(
    (type: HapticFeedbackType = "light") => {
      if (!isSupported()) return;

      // Different vibration patterns for different feedback types
      const patterns: Record<HapticFeedbackType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10],
        warning: [20, 100, 20],
        error: [50, 100, 50, 100, 50],
      };

      const pattern = patterns[type];

      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
      } else {
        navigator.vibrate(pattern);
      }
    },
    [isSupported],
  );

  const triggerSelection = useCallback(() => {
    triggerHaptic("light");
  }, [triggerHaptic]);

  const triggerImpact = useCallback(
    (intensity: "light" | "medium" | "heavy" = "medium") => {
      triggerHaptic(intensity);
    },
    [triggerHaptic],
  );

  const triggerNotification = useCallback(
    (type: "success" | "warning" | "error" = "success") => {
      triggerHaptic(type);
    },
    [triggerHaptic],
  );

  return {
    isSupported: isSupported(),
    triggerHaptic,
    triggerSelection,
    triggerImpact,
    triggerNotification,
  };
}
