/**
 * Hook to prevent hydration mismatches
 * Use this when you need to render different content on server vs client
 */

"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the component has hydrated on the client
 * Use this to prevent hydration mismatches when using browser-only APIs
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hydrated = useHydration();
 *
 *   if (!hydrated) {
 *     return <Skeleton />; // Server-rendered fallback
 *   }
 *
 *   // Client-only code here
 *   return <div>{localStorage.getItem('theme')}</div>;
 * }
 * ```
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

/**
 * Returns true if code is running on the client
 * Useful for conditional rendering based on environment
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Safely access browser-only APIs
 * Returns undefined during SSR
 *
 * @example
 * ```tsx
 * const theme = useBrowserValue(() => localStorage.getItem('theme'));
 * ```
 */
export function useBrowserValue<T>(getValue: () => T): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    setValue(getValue());
  }, [getValue]);

  return value;
}
