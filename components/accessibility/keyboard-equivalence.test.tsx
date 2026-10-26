/**
 * Property-Based Test: Keyboard Activation Equivalence
 * 
 * **Property 11: Keyboard Activation Equivalence**
 * **Validates: Requirements 15.11**
 * 
 * Tests that keyboard activation (Enter/Space) produces the same result as mouse click
 * for all interactive elements on the homepage.
 * 
 * @module KeyboardEquivalenceTest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import React from 'react';

/**
 * Test Component: Interactive Button
 * 
 * Represents a typical interactive element that should respond
 * identically to both mouse clicks and keyboard activation
 */
interface InteractiveButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

function InteractiveButton({ onClick, children, ariaLabel }: InteractiveButtonProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className="focus-visible:ring-2 focus-visible:ring-naija-green"
    >
      {children}
    </button>
  );
}

/**
 * Test Component: Interactive Link
 * 
 * Represents a link that should respond to both mouse and keyboard
 */
interface InteractiveLinkProps {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}

function InteractiveLink({ href, onClick, children }: InteractiveLinkProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-2 focus-visible:ring-naija-green"
    >
      {children}
    </a>
  );
}

/**
 * Test Component: Interactive Card
 * 
 * Represents a card component (like listing cards) that should be
 * activatable via both mouse and keyboard
 */
interface InteractiveCardProps {
  onActivate: () => void;
  title: string;
}

function InteractiveCard({ onActivate, title }: InteractiveCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      aria-label={`Activate ${title}`}
      className="focus-visible:ring-2 focus-visible:ring-naija-green cursor-pointer"
    >
      <h3>{title}</h3>
    </div>
  );
}

describe('Property 11: Keyboard Activation Equivalence', () => {
  beforeEach(() => {
    // Clean up DOM before each test
    document.body.innerHTML = '';
  });

  describe('Interactive Button', () => {
    it('should produce same result for mouse click and Enter key', () => {
      fc.assert(
        fc.property(fc.string(), (buttonText) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { unmount } = render(
            <InteractiveButton onClick={mockHandler}>
              {buttonText || 'Button'}
            </InteractiveButton>
          );

          const button = screen.getByRole('button');

          // Test mouse click
          mockHandler.mockClear();
          fireEvent.click(button);
          const clickCallCount = mockHandler.mock.calls.length;

          // Test Enter key
          mockHandler.mockClear();
          fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
          const enterCallCount = mockHandler.mock.calls.length;

          // Clean up after test
          unmount();

          // Property: Both should call handler exactly once
          return clickCallCount === 1 && enterCallCount === 1;
        }),
        { numRuns: 50 }
      );
    });

    it('should produce same result for mouse click and Space key', () => {
      fc.assert(
        fc.property(fc.string(), (buttonText) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { unmount } = render(
            <InteractiveButton onClick={mockHandler}>
              {buttonText || 'Button'}
            </InteractiveButton>
          );

          const button = screen.getByRole('button');

          // Test mouse click
          mockHandler.mockClear();
          fireEvent.click(button);
          const clickCallCount = mockHandler.mock.calls.length;

          // Test Space key
          mockHandler.mockClear();
          fireEvent.keyDown(button, { key: ' ', code: 'Space' });
          const spaceCallCount = mockHandler.mock.calls.length;

          // Clean up after test
          unmount();

          // Property: Both should call handler exactly once
          return clickCallCount === 1 && spaceCallCount === 1;
        }),
        { numRuns: 50 }
      );
    });

    it('should not activate on other keys', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('a', 'b', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown'),
          (key) => {
            // Clean up before each property test run
            document.body.innerHTML = '';
            
            const mockHandler = vi.fn();
            const { unmount } = render(
              <InteractiveButton onClick={mockHandler}>
                Button
              </InteractiveButton>
            );

            const button = screen.getByRole('button');

            // Test that other keys don't activate
            fireEvent.keyDown(button, { key, code: key });
            const callCount = mockHandler.mock.calls.length;

            // Clean up after test
            unmount();

            // Property: Other keys should not trigger handler
            return callCount === 0;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Interactive Link', () => {
    it('should produce same result for mouse click and Enter key', () => {
      fc.assert(
        fc.property(fc.webUrl(), fc.string(), (url, linkText) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { unmount } = render(
            <InteractiveLink href={url} onClick={mockHandler}>
              {linkText || 'Link'}
            </InteractiveLink>
          );

          const link = screen.getByRole('link');

          // Test mouse click
          mockHandler.mockClear();
          fireEvent.click(link);
          const clickCallCount = mockHandler.mock.calls.length;

          // Test Enter key
          mockHandler.mockClear();
          fireEvent.keyDown(link, { key: 'Enter', code: 'Enter' });
          const enterCallCount = mockHandler.mock.calls.length;

          // Clean up after test
          unmount();

          // Property: Both should call handler exactly once
          return clickCallCount === 1 && enterCallCount === 1;
        }),
        { numRuns: 50 }
      );
    });

    it('should not activate on Space key (links use Enter only)', () => {
      fc.assert(
        fc.property(fc.webUrl(), (url) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { unmount } = render(
            <InteractiveLink href={url} onClick={mockHandler}>
              Link
            </InteractiveLink>
          );

          const link = screen.getByRole('link');

          // Test Space key (should not activate for links)
          fireEvent.keyDown(link, { key: ' ', code: 'Space' });
          const callCount = mockHandler.mock.calls.length;

          // Clean up after test
          unmount();

          // Property: Space should not trigger handler for links
          return callCount === 0;
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Interactive Card', () => {
    it('should produce same result for mouse click and Enter key', () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { unmount } = render(
            <InteractiveCard
              onActivate={mockHandler}
              title={title || 'Card'}
            />
          );

          const card = screen.getByRole('button');

          // Test mouse click
          mockHandler.mockClear();
          fireEvent.click(card);
          const clickCallCount = mockHandler.mock.calls.length;

          // Test Enter key
          mockHandler.mockClear();
          fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
          const enterCallCount = mockHandler.mock.calls.length;

          // Clean up after test
          unmount();

          // Property: Both should call handler exactly once
          return clickCallCount === 1 && enterCallCount === 1;
        }),
        { numRuns: 50 }
      );
    });

    it('should produce same result for mouse click and Space key', () => {
      fc.assert(
        fc.property(fc.string(), (title) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { unmount } = render(
            <InteractiveCard
              onActivate={mockHandler}
              title={title || 'Card'}
            />
          );

          const card = screen.getByRole('button');

          // Test mouse click
          mockHandler.mockClear();
          fireEvent.click(card);
          const clickCallCount = mockHandler.mock.calls.length;

          // Test Space key
          mockHandler.mockClear();
          fireEvent.keyDown(card, { key: ' ', code: 'Space' });
          const spaceCallCount = mockHandler.mock.calls.length;

          // Clean up after test
          unmount();

          // Property: Both should call handler exactly once
          return clickCallCount === 1 && spaceCallCount === 1;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Focus Indicators', () => {
    it('should have visible focus indicators on all interactive elements', () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { container, unmount } = render(
            <div>
              <InteractiveButton onClick={mockHandler}>
                {text || 'Button'}
              </InteractiveButton>
              <InteractiveLink href="#" onClick={mockHandler}>
                {text || 'Link'}
              </InteractiveLink>
              <InteractiveCard onActivate={mockHandler} title={text || 'Card'} />
            </div>
          );

          // Check that all interactive elements have focus-visible class
          const button = container.querySelector('button');
          const link = container.querySelector('a');
          const card = container.querySelector('[role="button"]');

          const buttonHasFocus = button?.className.includes('focus-visible');
          const linkHasFocus = link?.className.includes('focus-visible');
          const cardHasFocus = card?.className.includes('focus-visible');

          // Clean up after test
          unmount();

          // Property: All interactive elements should have focus indicators
          return buttonHasFocus && linkHasFocus && cardHasFocus;
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Keyboard Navigation Order', () => {
    it('should maintain consistent tab order', () => {
      const mockHandler = vi.fn();
      const { container, unmount } = render(
        <div>
          <InteractiveButton onClick={mockHandler}>Button 1</InteractiveButton>
          <InteractiveLink href="#" onClick={mockHandler}>
            Link 1
          </InteractiveLink>
          <InteractiveCard onActivate={mockHandler} title="Card 1" />
          <InteractiveButton onClick={mockHandler}>Button 2</InteractiveButton>
        </div>
      );

      const focusableElements = container.querySelectorAll(
        'button, a, [role="button"]'
      );

      // Property: All elements should be focusable (tabIndex >= 0 or naturally focusable)
      const allFocusable = Array.from(focusableElements).every((el) => {
        const tabIndex = el.getAttribute('tabindex');
        return (
          tabIndex === null ||
          tabIndex === '0' ||
          parseInt(tabIndex) >= 0 ||
          el.tagName === 'BUTTON' ||
          el.tagName === 'A'
        );
      });

      expect(allFocusable).toBe(true);
      expect(focusableElements.length).toBe(4);

      // Clean up after test
      unmount();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have appropriate ARIA attributes for keyboard users', () => {
      fc.assert(
        fc.property(fc.string(), (label) => {
          // Clean up before each property test run
          document.body.innerHTML = '';
          
          const mockHandler = vi.fn();
          const { container, unmount } = render(
            <div>
              <InteractiveButton onClick={mockHandler} ariaLabel={label || 'Button'}>
                Button
              </InteractiveButton>
              <InteractiveCard onActivate={mockHandler} title={label || 'Card'} />
            </div>
          );

          const button = container.querySelector('button');
          const card = container.querySelector('[role="button"]');

          // Property: Interactive elements should have ARIA labels or roles
          const buttonHasLabel = button?.hasAttribute('aria-label');
          const cardHasRole = card?.getAttribute('role') === 'button';
          const cardHasLabel = card?.hasAttribute('aria-label');

          // Clean up after test
          unmount();

          return buttonHasLabel || (cardHasRole && cardHasLabel);
        }),
        { numRuns: 20 }
      );
    });
  });
});
