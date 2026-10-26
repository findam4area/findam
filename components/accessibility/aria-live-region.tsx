/**
 * ARIA Live Region Component
 * 
 * Provides accessible announcements for dynamic content updates
 * Requirements: 9.6, 10.4, 11.9
 * 
 * @component
 */

'use client';

import React, { useEffect, useRef } from 'react';

interface AriaLiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // milliseconds to clear message after announcement
  role?: 'status' | 'alert' | 'log';
}

/**
 * ARIA Live Region for dynamic content announcements
 * 
 * @example
 * ```tsx
 * <AriaLiveRegion 
 *   message="Item added to cart" 
 *   politeness="polite"
 *   clearAfter={3000}
 * />
 * ```
 */
export function AriaLiveRegion({ 
  message, 
  politeness = 'polite',
  clearAfter,
  role = 'status'
}: AriaLiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (clearAfter && message) {
      timeoutRef.current = setTimeout(() => {
        // Message will be cleared by parent component
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  if (!message) return null;

  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

interface ToastAnnouncerProps {
  announcements: string[];
}

/**
 * Toast Announcer - announces toast messages to screen readers
 * Works with toast libraries like sonner
 */
export function ToastAnnouncer({ announcements }: ToastAnnouncerProps) {
  return (
    <div role="region" aria-label="Notifications" className="sr-only">
      {announcements.map((announcement, index) => (
        <div key={`${announcement}-${index}`} role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      ))}
    </div>
  );
}

interface FormErrorAnnouncerProps {
  errors: Record<string, string>;
}

/**
 * Form Error Announcer - announces form validation errors
 * 
 * @example
 * ```tsx
 * <FormErrorAnnouncer errors={{
 *   email: "Email is required",
 *   password: "Password must be at least 8 characters"
 * }} />
 * ```
 */
export function FormErrorAnnouncer({ errors }: FormErrorAnnouncerProps) {
  const errorMessages = Object.values(errors).filter(Boolean);
  const errorCount = errorMessages.length;

  if (errorCount === 0) return null;

  return (
    <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
      {errorCount === 1 
        ? `Error: ${errorMessages[0]}` 
        : `${errorCount} errors found: ${errorMessages.join(', ')}`
      }
    </div>
  );
}

interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}

/**
 * Loading Announcer - announces loading state changes
 * 
 * @example
 * ```tsx
 * <LoadingAnnouncer 
 *   isLoading={isSubmitting}
 *   loadingMessage="Submitting form"
 *   completeMessage="Form submitted successfully"
 * />
 * ```
 */
export function LoadingAnnouncer({ 
  isLoading, 
  loadingMessage = 'Loading',
  completeMessage = 'Loading complete'
}: LoadingAnnouncerProps) {
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    if (isLoading) {
      setMessage(loadingMessage);
    } else if (message === loadingMessage) {
      setMessage(completeMessage);
      // Clear complete message after announcement
      const timer = setTimeout(() => setMessage(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingMessage, completeMessage, message]);

  if (!message) return null;

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

interface SearchResultsAnnouncerProps {
  count: number;
  query?: string;
  isLoading?: boolean;
}

/**
 * Search Results Announcer - announces search results count
 * 
 * @example
 * ```tsx
 * <SearchResultsAnnouncer 
 *   count={42}
 *   query="laptops"
 *   isLoading={false}
 * />
 * ```
 */
export function SearchResultsAnnouncer({ count, query, isLoading }: SearchResultsAnnouncerProps) {
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    if (isLoading) {
      setMessage('Searching...');
    } else {
      const baseMessage = count === 0 
        ? 'No results found'
        : count === 1
        ? '1 result found'
        : `${count} results found`;
      
      setMessage(query ? `${baseMessage} for "${query}"` : baseMessage);
    }
  }, [count, query, isLoading]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
