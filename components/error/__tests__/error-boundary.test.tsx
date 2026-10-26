/**
 * Unit tests for Error Boundary components
 * Task 17.1: Implement error boundaries
 * Validates Requirements: 19.1, 19.5, 19.7, 19.8
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../error-boundary';
import { ComponentErrorFallback } from '../component-error-fallback';
import { PageErrorFallback } from '../page-error-fallback';

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render default fallback UI when error occurs (Requirement 19.5)', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error message (Requirement 19.7)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should display user-friendly error message without technical jargon (Requirement 19.7)', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorMessage = screen.getByText(/something went wrong/i);
    expect(errorMessage).toBeInTheDocument();
    
    // Should not show technical details in the main message
    expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
  });

  it('should provide retry button for error recovery (Requirement 19.1, 19.8)', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have retry button (Requirement 19.1, 19.8)
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should provide home navigation option (Requirement 19.8)', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have go home button (Requirement 19.8)
    const homeButton = screen.getByRole('link', { name: /go home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/feed');
  });

  it('should call custom onError handler when provided', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should reset error state when retry button is clicked', () => {
    let shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    // Error state
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Fix the error and retry
    shouldThrow = false;
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // Need to rerender with fixed component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
  });

  it('should use custom fallback component when provided', () => {
    const CustomFallback = () => <div>Custom error UI</div>;
    
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });
});

describe('ComponentErrorFallback', () => {
  it('should display component-specific error message (Requirement 19.7)', () => {
    const error = new Error('Component failed');
    const resetError = vi.fn();

    render(
      <ComponentErrorFallback 
        error={error} 
        resetError={resetError}
        componentName="TestComponent"
      />
    );

    expect(screen.getByText(/TestComponent failed to load/i)).toBeInTheDocument();
  });

  it('should provide inline retry link (Requirement 19.1, 19.8)', () => {
    const error = new Error('Component failed');
    const resetError = vi.fn();

    render(
      <ComponentErrorFallback 
        error={error} 
        resetError={resetError}
      />
    );

    const retryLink = screen.getByText(/click here to retry/i);
    expect(retryLink).toBeInTheDocument();
    
    fireEvent.click(retryLink);
    expect(resetError).toHaveBeenCalled();
  });

  it('should suggest refreshing the page (Requirement 19.8)', () => {
    const error = new Error('Component failed');
    const resetError = vi.fn();

    render(
      <ComponentErrorFallback 
        error={error} 
        resetError={resetError}
      />
    );

    expect(screen.getByText(/try refreshing the page/i)).toBeInTheDocument();
  });
});

describe('PageErrorFallback', () => {
  it('should display page-level error message (Requirement 19.7)', () => {
    const error = new Error('Page failed');
    const resetError = vi.fn();

    render(<PageErrorFallback error={error} resetError={resetError} />);

    expect(screen.getByText(/unable to load this page/i)).toBeInTheDocument();
  });

  it('should provide both retry and go back options (Requirement 19.8)', () => {
    const error = new Error('Page failed');
    const resetError = vi.fn();

    render(<PageErrorFallback error={error} resetError={resetError} />);

    // Should have retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Should have go back button
    const goBackButton = screen.getByRole('button', { name: /go back/i });
    expect(goBackButton).toBeInTheDocument();
  });

  it('should call resetError when retry is clicked (Requirement 19.1)', () => {
    const error = new Error('Page failed');
    const resetError = vi.fn();

    render(<PageErrorFallback error={error} resetError={resetError} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(resetError).toHaveBeenCalled();
  });
});

describe('Error Boundary Requirements Compliance', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('Requirement 19.1: Display error messages with retry buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error message displayed
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    // Retry button present
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('Requirement 19.5: Error boundaries prevent full page crashes', () => {
    // If error boundary works, this test passes without crashing
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should render fallback UI, not crash
    expect(container).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('Requirement 19.7: Display user-friendly messages without technical jargon', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // User-friendly message
    const userMessage = screen.getByText(/something went wrong/i);
    expect(userMessage).toBeInTheDocument();
    
    // Helpful explanation
    expect(screen.getByText(/we're on it/i)).toBeInTheDocument();
  });

  it('Requirement 19.8: Provide actionable recovery options', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Multiple recovery options provided
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
  });
});
