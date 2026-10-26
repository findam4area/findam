/**
 * Virtual scrolling hook for large lists
 * Improves performance by only rendering visible items
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  overscan?: number;
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 3,
}: UseVirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  const totalHeight = itemHeight * itemCount;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  // Generate virtual items
  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      size: itemHeight,
    });
  }

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollElementRef.current) {
        const targetScrollTop = index * itemHeight;
        scrollElementRef.current.scrollTop = targetScrollTop;
        setScrollTop(targetScrollTop);
      }
    },
    [itemHeight],
  );

  // Handle scroll events
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrollTop(target.scrollTop);
    };

    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
  };
}
