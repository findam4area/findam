"use client";

/**
 * FocusOnMount Component
 * 
 * A client component wrapper that sets focus on its child element when the component mounts.
 * Used for accessibility to ensure screen reader users land on the main heading of a page.
 * 
 * Requirement 16.33: Set focus on main heading when CategoryDetailPage loads
 */

import React, { useEffect, useRef, type ReactNode } from 'react';

interface FocusOnMountProps {
  children: ReactNode;
}

export function FocusOnMount({ children }: FocusOnMountProps) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Set focus on mount
    if (elementRef.current) {
      // Small delay to ensure the element is fully rendered
      setTimeout(() => {
        elementRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, []);

  // Clone the child element and add the ref
  if (typeof children === 'object' && children !== null && 'type' in children) {
    const child = children as React.ReactElement;
    return (
      <>
        {React.cloneElement(child, {
          ref: elementRef,
        } as any)}
      </>
    );
  }

  return <>{children}</>;
}
