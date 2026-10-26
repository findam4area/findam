"use client";

import { useEffect } from "react";
import { initErrorTracker, setErrorTrackingUser } from "@/lib/errors";
import { useAuth } from "@/lib/hooks/useAuth";

export function ErrorTrackerInit() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize error tracker on mount
    try {
      initErrorTracker();
    } catch (error) {
      console.error("[ErrorTrackerInit] Failed to initialize error tracker:", error);
    }
  }, []);

  useEffect(() => {
    // Update user context when user changes
    try {
      if (user) {
        setErrorTrackingUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      } else {
        setErrorTrackingUser(null);
      }
    } catch (error) {
      console.error("[ErrorTrackerInit] Failed to set user:", error);
    }
  }, [user]);

  return null;
}
