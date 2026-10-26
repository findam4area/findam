/**
 * Keyboard Navigation Hook
 * 
 * Provides utilities for implementing keyboard navigation patterns
 * Requirements: 15.4, 15.8
 * 
 * @module useKeyboardNavigation
 */

import { useCallback, KeyboardEvent } from 'react';

interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  preventDefault?: boolean;
}

/**
 * Hook for handling keyboard navigation events
 * 
 * @param options - Configuration object for keyboard event handlers
 * @returns Keyboard event handler function
 * 
 * @example
 * ```tsx
 * const handleKeyDown = useKeyboardNavigation({
 *   onEnter: () => handleSelect(),
 *   onEscape: () => handleClose(),
 *   onArrowRight: () => focusNext(),
 *   onArrowLeft: () => focusPrevious(),
 * });
 * 
 * <div onKeyDown={handleKeyDown} tabIndex={0}>...</div>
 * ```
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;

      switch (key) {
        case 'Enter':
          if (onEnter) {
            if (preventDefault) event.preventDefault();
            onEnter();
          }
          break;

        case ' ':
        case 'Spacebar': // For older browsers
          if (onSpace) {
            if (preventDefault) event.preventDefault();
            onSpace();
          }
          break;

        case 'Escape':
        case 'Esc': // For older browsers
          if (onEscape) {
            if (preventDefault) event.preventDefault();
            onEscape();
          }
          break;

        case 'ArrowUp':
        case 'Up': // For older browsers
          if (onArrowUp) {
            if (preventDefault) event.preventDefault();
            onArrowUp();
          }
          break;

        case 'ArrowDown':
        case 'Down': // For older browsers
          if (onArrowDown) {
            if (preventDefault) event.preventDefault();
            onArrowDown();
          }
          break;

        case 'ArrowLeft':
        case 'Left': // For older browsers
          if (onArrowLeft) {
            if (preventDefault) event.preventDefault();
            onArrowLeft();
          }
          break;

        case 'ArrowRight':
        case 'Right': // For older browsers
          if (onArrowRight) {
            if (preventDefault) event.preventDefault();
            onArrowRight();
          }
          break;

        case 'Home':
          if (onHome) {
            if (preventDefault) event.preventDefault();
            onHome();
          }
          break;

        case 'End':
          if (onEnd) {
            if (preventDefault) event.preventDefault();
            onEnd();
          }
          break;

        default:
          break;
      }
    },
    [
      onEnter,
      onSpace,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onHome,
      onEnd,
      preventDefault,
    ]
  );

  return handleKeyDown;
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Focus the next focusable element in a container
   */
  focusNext: (container: HTMLElement, currentElement: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  },

  /**
   * Focus the previous focusable element in a container
   */
  focusPrevious: (container: HTMLElement, currentElement: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(currentElement);
    const previousIndex =
      (currentIndex - 1 + focusableElements.length) % focusableElements.length;
    focusableElements[previousIndex]?.focus();
  },

  /**
   * Focus the first focusable element in a container
   */
  focusFirst: (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    focusableElements[0]?.focus();
  },

  /**
   * Focus the last focusable element in a container
   */
  focusLast: (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    focusableElements[focusableElements.length - 1]?.focus();
  },

  /**
   * Trap focus within a container (useful for modals)
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  },
};

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

/**
 * Hook for managing roving tabindex pattern (for grids, lists, etc.)
 * 
 * @example
 * ```tsx
 * const { activeIndex, setActiveIndex, handleKeyDown } = useRovingTabIndex({
 *   itemCount: items.length,
 *   orientation: 'horizontal',
 * });
 * 
 * items.map((item, index) => (
 *   <button
 *     key={item.id}
 *     tabIndex={activeIndex === index ? 0 : -1}
 *     onKeyDown={handleKeyDown(index)}
 *     onFocus={() => setActiveIndex(index)}
 *   >
 *     {item.name}
 *   </button>
 * ))
 * ```
 */
export function useRovingTabIndex({
  itemCount,
  orientation = 'horizontal',
  loop = true,
}: {
  itemCount: number;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = useCallback(
    (index: number) => (event: KeyboardEvent) => {
      const { key } = event;

      let newIndex = index;

      switch (key) {
        case 'ArrowRight':
        case 'Right':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            newIndex = loop
              ? (index + 1) % itemCount
              : Math.min(index + 1, itemCount - 1);
          }
          break;

        case 'ArrowLeft':
        case 'Left':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            newIndex = loop
              ? (index - 1 + itemCount) % itemCount
              : Math.max(index - 1, 0);
          }
          break;

        case 'ArrowDown':
        case 'Down':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            newIndex = loop
              ? (index + 1) % itemCount
              : Math.min(index + 1, itemCount - 1);
          }
          break;

        case 'ArrowUp':
        case 'Up':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            newIndex = loop
              ? (index - 1 + itemCount) % itemCount
              : Math.max(index - 1, 0);
          }
          break;

        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          newIndex = itemCount - 1;
          break;

        default:
          break;
      }

      if (newIndex !== index) {
        setActiveIndex(newIndex);
      }
    },
    [itemCount, orientation, loop]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}

// Add React import for useRovingTabIndex
import * as React from 'react';
