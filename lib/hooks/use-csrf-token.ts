/**
 * Client-side CSRF token management hook
 * Requirements: 31.4
 */

"use client";

import { useEffect, useState } from "react";

const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Hook to get CSRF token from meta tag or cookie
 * Automatically includes token in fetch requests
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to get token from meta tag first
    const metaToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");

    if (metaToken) {
      setToken(metaToken);
      return;
    }

    // Fallback: get from cookie
    const cookieToken = getCsrfTokenFromCookie();
    if (cookieToken) {
      setToken(cookieToken);
    }
  }, []);

  return token;
}

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrf-token") {
      return value;
    }
  }
  return null;
}

/**
 * Enhanced fetch with automatic CSRF token inclusion
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getCsrfTokenFromCookie();

  const headers = new Headers(options.headers);

  // Add CSRF token for non-GET requests
  if (token && options.method && options.method.toUpperCase() !== "GET") {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get headers with CSRF token for manual fetch calls
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfTokenFromCookie();

  if (!token) {
    return {};
  }

  return {
    [CSRF_HEADER_NAME]: token,
  };
}
