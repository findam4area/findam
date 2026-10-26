/**
 * Tests for Error Pages
 * 
 * Verifies that error boundaries and not-found pages render correctly
 * and provide appropriate user-facing messages and actions.
 * 
 * Requirements: 5.1, 5.2, 5.3
 * - 5.1: Captures client-side JavaScript errors
 * - 5.2: Captures unhandled promise rejections
 * - 5.3: Includes stack trace information for all captured errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RootError from '../error';
import NotFound from '../not-found';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('Error Pages', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('RootError (error.tsx)', () => {
    it('should render error message with user-friendly text', () => {
      const mockError = new Error('Test error message');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      // Check for user-friendly heading
      expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
      
      // Check for user guidance
      expect(screen.getByText(/we encountered an unexpected error/i)).toBeInTheDocument();
    });

    it('should capture error with Sentry on mount (Requirement 5.3)', () => {
      const mockError = new Error('Test error message');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      // Verify Sentry.captureException was called with the error
      expect(Sentry.captureException).toHaveBeenCalledWith(mockError);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('should re-capture error if error changes', () => {
      const mockError1 = new Error('First error');
      const mockReset = vi.fn();

      const { rerender } = render(<RootError error={mockError1} reset={mockReset} />);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);

      // Change the error
      const mockError2 = new Error('Second error');
      rerender(<RootError error={mockError2} reset={mockReset} />);

      // Should capture the new error
      expect(Sentry.captureException).toHaveBeenCalledTimes(2);
      expect(Sentry.captureException).toHaveBeenCalledWith(mockError2);
    });

    it('should display Try Again button', () => {
      const mockError = new Error('Test error');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should display Go to Homepage button', () => {
      const mockError = new Error('Test error');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      const homeButton = screen.getByRole('link', { name: /go to homepage/i });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveAttribute('href', '/');
    });

    it('should call reset when Try Again is clicked', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Test error');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('should log error to console', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Test error message');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', mockError);
      
      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log error to console in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Test error message');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      // Should not log to console in production
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should display error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockError = new Error('Detailed error message');
      const mockReset = vi.fn();

      render(<RootError error={mockError} reset={mockReset} />);

      expect(screen.getByText('Detailed error message')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('NotFound (not-found.tsx)', () => {
    it('should render 404 heading', () => {
      render(<NotFound />);

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });

    it('should display user-friendly message', () => {
      render(<NotFound />);

      expect(screen.getByText(/sorry, we couldn't find the page/i)).toBeInTheDocument();
    });

    it('should display Go to Homepage button', () => {
      render(<NotFound />);

      const homeButton = screen.getByRole('link', { name: /go to homepage/i });
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveAttribute('href', '/');
    });

    it('should display Browse Listings button', () => {
      render(<NotFound />);

      const browseButton = screen.getByRole('link', { name: /browse listings/i });
      expect(browseButton).toBeInTheDocument();
      expect(browseButton).toHaveAttribute('href', '/browse');
    });

    it('should display Explore Categories link', () => {
      render(<NotFound />);

      const categoriesLink = screen.getByRole('link', { name: /explore categories/i });
      expect(categoriesLink).toBeInTheDocument();
      expect(categoriesLink).toHaveAttribute('href', '/categories');
    });

    it('should have proper accessibility attributes', () => {
      render(<NotFound />);

      // All buttons should be properly accessible
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });
});
