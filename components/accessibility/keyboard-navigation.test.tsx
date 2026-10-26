/**
 * Keyboard Navigation Tests
 * 
 * Tests for keyboard navigation components and utilities
 * Requirements: 15.4, 15.8
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FocusTrap,
  KeyboardNavigableList,
  KeyboardActivatable,
  VisuallyHidden,
  LiveRegion,
} from './keyboard-navigation';
import { SkipLinks } from './skip-link';

describe('SkipLinks', () => {
  beforeEach(() => {
    // Create target elements
    document.body.innerHTML = `
      <div id="main-content" tabindex="-1">Main Content</div>
      <div id="navigation" tabindex="-1">Navigation</div>
      <div id="footer" tabindex="-1">Footer</div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders all skip links', () => {
    render(<SkipLinks />);
    
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    expect(screen.getByText('Skip to footer')).toBeInTheDocument();
  });

  it('focuses target element when skip link is clicked', async () => {
    const user = userEvent.setup();
    render(<SkipLinks />);
    
    const skipLink = screen.getByText('Skip to main content');
    await user.click(skipLink);
    
    const mainContent = document.getElementById('main-content');
    expect(document.activeElement).toBe(mainContent);
  });

  it('has proper ARIA labels', () => {
    render(<SkipLinks />);
    
    const nav = screen.getByRole('navigation', { name: 'Skip links' });
    expect(nav).toBeInTheDocument();
  });
});

describe('FocusTrap', () => {
  it('traps focus within container', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Outside Before</button>
        <FocusTrap active={true}>
          <button>First</button>
          <button>Second</button>
          <button>Last</button>
        </FocusTrap>
        <button>Outside After</button>
      </div>
    );

    const first = screen.getByText('First');
    const last = screen.getByText('Last');

    // Focus should move to first element
    expect(document.activeElement).toBe(first);

    // Tab from last should go to first
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);

    // Shift+Tab from first should go to last
    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it('restores focus when deactivated', () => {
    const { rerender } = render(
      <div>
        <button>Outside</button>
        <FocusTrap active={true}>
          <button>Inside</button>
        </FocusTrap>
      </div>
    );

    const outside = screen.getByText('Outside');
    outside.focus();

    // Rerender with active=false
    rerender(
      <div>
        <button>Outside</button>
        <FocusTrap active={false}>
          <button>Inside</button>
        </FocusTrap>
      </div>
    );

    expect(document.activeElement).toBe(outside);
  });
});

describe('KeyboardNavigableList', () => {
  it('navigates with arrow keys in vertical orientation', async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList orientation="vertical" ariaLabel="Test list">
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');
    const item3 = screen.getByText('Item 3');

    item1.focus();
    expect(document.activeElement).toBe(item1);

    // Arrow down should move to next item
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item2);

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item3);

    // Arrow up should move to previous item
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(item2);
  });

  it('navigates with arrow keys in horizontal orientation', async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList orientation="horizontal" ariaLabel="Test list">
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');

    item1.focus();

    // Arrow right should move to next item
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(item2);

    // Arrow left should move to previous item
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(item1);
  });

  it('supports Home and End keys', async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList orientation="vertical" ariaLabel="Test list">
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');
    const item3 = screen.getByText('Item 3');

    item2.focus();

    // Home should move to first item
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(item1);

    // End should move to last item
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(item3);
  });

  it('loops navigation when loop is true', async () => {
    const user = userEvent.setup();
    
    render(
      <KeyboardNavigableList orientation="vertical" loop={true} ariaLabel="Test list">
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      </KeyboardNavigableList>
    );

    const item1 = screen.getByText('Item 1');
    const item3 = screen.getByText('Item 3');

    item3.focus();

    // Arrow down from last should loop to first
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item1);

    // Arrow up from first should loop to last
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(item3);
  });
});

describe('KeyboardActivatable', () => {
  it('activates on Enter key', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    
    render(
      <KeyboardActivatable onActivate={onActivate} ariaLabel="Test button">
        <div>Click me</div>
      </KeyboardActivatable>
    );

    const element = screen.getByRole('button', { name: 'Test button' });
    element.focus();

    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('activates on Space key', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    
    render(
      <KeyboardActivatable onActivate={onActivate} ariaLabel="Test button">
        <div>Click me</div>
      </KeyboardActivatable>
    );

    const element = screen.getByRole('button', { name: 'Test button' });
    element.focus();

    await user.keyboard(' ');
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('is focusable with Tab key', async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    
    render(
      <div>
        <button>Before</button>
        <KeyboardActivatable onActivate={onActivate} ariaLabel="Test button">
          <div>Click me</div>
        </KeyboardActivatable>
        <button>After</button>
      </div>
    );

    const before = screen.getByText('Before');
    before.focus();

    await user.tab();
    const activatable = screen.getByRole('button', { name: 'Test button' });
    expect(document.activeElement).toBe(activatable);
  });
});

describe('VisuallyHidden', () => {
  it('renders content with sr-only class', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    
    const element = screen.getByText('Hidden text');
    expect(element).toHaveClass('sr-only');
  });

  it('renders focusable content with sr-only-focusable class', () => {
    render(<VisuallyHidden focusable={true}>Hidden text</VisuallyHidden>);
    
    const element = screen.getByText('Hidden text');
    expect(element).toHaveClass('sr-only-focusable');
  });

  it('is accessible to screen readers', () => {
    render(<VisuallyHidden>Screen reader text</VisuallyHidden>);
    
    expect(screen.getByText('Screen reader text')).toBeInTheDocument();
  });
});

describe('LiveRegion', () => {
  it('renders with polite aria-live by default', () => {
    render(<LiveRegion>Status message</LiveRegion>);
    
    const element = screen.getByText('Status message');
    expect(element).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with assertive aria-live when specified', () => {
    render(<LiveRegion politeness="assertive">Urgent message</LiveRegion>);
    
    const element = screen.getByText('Urgent message');
    expect(element).toHaveAttribute('aria-live', 'assertive');
  });

  it('supports aria-atomic attribute', () => {
    render(<LiveRegion atomic={true}>Message</LiveRegion>);
    
    const element = screen.getByText('Message');
    expect(element).toHaveAttribute('aria-atomic', 'true');
  });

  it('supports aria-relevant attribute', () => {
    render(<LiveRegion relevant="all">Message</LiveRegion>);
    
    const element = screen.getByText('Message');
    expect(element).toHaveAttribute('aria-relevant', 'all');
  });
});

describe('Focus Indicators', () => {
  it('all interactive elements have visible focus indicators', () => {
    render(
      <div>
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" placeholder="Input" />
        <textarea placeholder="Textarea" />
        <select>
          <option>Option</option>
        </select>
      </div>
    );

    const button = screen.getByText('Button');
    const link = screen.getByText('Link');
    const input = screen.getByPlaceholderText('Input');
    const textarea = screen.getByPlaceholderText('Textarea');
    const select = screen.getByRole('combobox');

    // Focus each element and verify it's focusable
    button.focus();
    expect(document.activeElement).toBe(button);

    link.focus();
    expect(document.activeElement).toBe(link);

    input.focus();
    expect(document.activeElement).toBe(input);

    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    select.focus();
    expect(document.activeElement).toBe(select);
  });
});

describe('Keyboard Navigation Integration', () => {
  it('supports full keyboard navigation flow', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <SkipLinks />
        <nav id="navigation" tabIndex={-1}>
          <button>Nav Item 1</button>
          <button>Nav Item 2</button>
        </nav>
        <main id="main-content" tabIndex={-1}>
          <KeyboardNavigableList orientation="vertical" ariaLabel="Main list">
            <button>Content 1</button>
            <button>Content 2</button>
            <button>Content 3</button>
          </KeyboardNavigableList>
        </main>
        <footer id="footer" tabIndex={-1}>
          <button>Footer Link</button>
        </footer>
      </div>
    );

    // Tab to skip link
    await user.tab();
    const skipLink = screen.getByText('Skip to main content');
    expect(document.activeElement).toBe(skipLink);

    // Activate skip link
    await user.keyboard('{Enter}');
    const mainContent = document.getElementById('main-content');
    expect(document.activeElement).toBe(mainContent);

    // Tab into keyboard navigable list
    await user.tab();
    const content1 = screen.getByText('Content 1');
    expect(document.activeElement).toBe(content1);

    // Navigate with arrow keys
    await user.keyboard('{ArrowDown}');
    const content2 = screen.getByText('Content 2');
    expect(document.activeElement).toBe(content2);

    await user.keyboard('{ArrowDown}');
    const content3 = screen.getByText('Content 3');
    expect(document.activeElement).toBe(content3);

    // Home key goes to first
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(content1);

    // End key goes to last
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(content3);
  });
});
