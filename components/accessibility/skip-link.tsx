/**
 * Skip Link Component
 * 
 * Provides keyboard navigation shortcuts to main content areas
 * Requirements: 15.4, 15.8
 * 
 * @component
 */

'use client';

import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      // Set focus to the target element
      (target as HTMLElement).focus();
      // Scroll to the target element (check if method exists for test environment)
      if (typeof (target as HTMLElement).scrollIntoView === 'function') {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <a
      href={href}
      className="skip-link"
      onClick={handleClick}
      aria-label={`${children}`}
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Container
 * 
 * Renders multiple skip links for keyboard navigation
 */
export function SkipLinks() {
  return (
    <nav aria-label="Skip links" className="sr-only-focusable">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#navigation">
        Skip to navigation
      </SkipLink>
      <SkipLink href="#footer">
        Skip to footer
      </SkipLink>
    </nav>
  );
}
