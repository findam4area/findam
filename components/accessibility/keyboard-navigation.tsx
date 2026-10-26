/**
 * Keyboard Navigation Components
 * 
 * Provides reusable components for implementing keyboard navigation patterns
 * Requirements: 15.4, 15.8
 * 
 * @module KeyboardNavigation
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useKeyboardNavigation, focusUtils } from '@/lib/hooks/useKeyboardNavigation';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * Focus Trap Component
 * 
 * Traps focus within a container, useful for modals and dialogs
 * 
 * @example
 * ```tsx
 * <FocusTrap active={isModalOpen}>
 *   <div>Modal content</div>
 * </FocusTrap>
 * ```
 */
export function FocusTrap({ children, active = true, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element when trap activates
    focusUtils.focusFirst(container);

    return () => {
      // Restore focus when trap deactivates
      previouslyFocused?.focus();
    };
  }, [active]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!active || !containerRef.current) return;
    focusUtils.trapFocus(containerRef.current, event);
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
}

interface KeyboardNavigableListProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
  className?: string;
  role?: string;
  ariaLabel?: string;
}

/**
 * Keyboard Navigable List Component
 * 
 * Provides arrow key navigation for lists of items
 * 
 * @example
 * ```tsx
 * <KeyboardNavigableList orientation="horizontal" ariaLabel="Categories">
 *   {categories.map(cat => (
 *     <button key={cat.id}>{cat.name}</button>
 *   ))}
 * </KeyboardNavigableList>
 * ```
 */
export function KeyboardNavigableList({
  children,
  orientation = 'vertical',
  loop = true,
  className,
  role = 'list',
  ariaLabel,
}: KeyboardNavigableListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentElement = document.activeElement as HTMLElement;

    if (!container.contains(currentElement)) return;

    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        if (loop) {
          focusUtils.focusNext(container, currentElement);
        } else {
          const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          const currentIndex = Array.from(focusableElements).indexOf(currentElement);
          if (currentIndex < focusableElements.length - 1) {
            (focusableElements[currentIndex + 1] as HTMLElement).focus();
          }
        }
        break;

      case prevKey:
        event.preventDefault();
        if (loop) {
          focusUtils.focusPrevious(container, currentElement);
        } else {
          const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          const currentIndex = Array.from(focusableElements).indexOf(currentElement);
          if (currentIndex > 0) {
            (focusableElements[currentIndex - 1] as HTMLElement).focus();
          }
        }
        break;

      case 'Home':
        event.preventDefault();
        focusUtils.focusFirst(container);
        break;

      case 'End':
        event.preventDefault();
        focusUtils.focusLast(container);
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

interface KeyboardActivatableProps {
  children: React.ReactNode;
  onActivate: () => void;
  className?: string;
  role?: string;
  ariaLabel?: string;
  tabIndex?: number;
}

/**
 * Keyboard Activatable Component
 * 
 * Makes any element activatable with Enter or Space keys
 * 
 * @example
 * ```tsx
 * <KeyboardActivatable onActivate={handleClick} ariaLabel="Open menu">
 *   <div>Click or press Enter/Space</div>
 * </KeyboardActivatable>
 * ```
 */
export function KeyboardActivatable({
  children,
  onActivate,
  className,
  role = 'button',
  ariaLabel,
  tabIndex = 0,
}: KeyboardActivatableProps) {
  const handleKeyDown = useKeyboardNavigation({
    onEnter: onActivate,
    onSpace: onActivate,
  });

  return (
    <div
      onKeyDown={handleKeyDown}
      className={className}
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  );
}

interface VisuallyHiddenProps {
  children: React.ReactNode;
  focusable?: boolean;
}

/**
 * Visually Hidden Component
 * 
 * Hides content visually but keeps it accessible to screen readers
 * 
 * @example
 * ```tsx
 * <VisuallyHidden>
 *   Additional context for screen readers
 * </VisuallyHidden>
 * ```
 */
export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  return (
    <span className={focusable ? 'sr-only-focusable' : 'sr-only'}>
      {children}
    </span>
  );
}

interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

/**
 * Live Region Component
 * 
 * Announces dynamic content changes to screen readers
 * 
 * @example
 * ```tsx
 * <LiveRegion politeness="polite">
 *   {statusMessage}
 * </LiveRegion>
 * ```
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions',
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  );
}
