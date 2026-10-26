/**
 * Query Provider Tests
 * 
 * Tests for TanStack Query configuration
 * Validates Requirements 29.1, 29.2, 29.3, 29.7, 29.9
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryProvider } from '@/lib/providers/query-provider';
import { useQueryClient } from '@tanstack/react-query';

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div>Test Content</div>
      </QueryProvider>
    );
    
    expect(screen.getByText('Test Content')).toBeDefined();
  });
  
  it('should provide QueryClient with correct configuration', () => {
    function TestComponent() {
      const queryClient = useQueryClient();
      const defaultOptions = queryClient.getDefaultOptions();
      
      return (
        <div>
          <div data-testid="stale-time">{typeof defaultOptions.queries?.staleTime === 'function' ? 'function' : defaultOptions.queries?.staleTime}</div>
          <div data-testid="gc-time">{defaultOptions.queries?.gcTime}</div>
          <div data-testid="refetch-on-focus">{String(defaultOptions.queries?.refetchOnWindowFocus)}</div>
        </div>
      );
    }
    
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );
    
    // Requirement 29.3: Stale time of 5 minutes for listings
    expect(screen.getByTestId('stale-time').textContent).toBe(String(5 * 60 * 1000));
    
    // Garbage collection time should be 10 minutes
    expect(screen.getByTestId('gc-time').textContent).toBe(String(10 * 60 * 1000));
    
    // Should not refetch on window focus
    expect(screen.getByTestId('refetch-on-focus').textContent).toBe('false');
  });
  
  it('should configure retry logic with exponential backoff', () => {
    function TestComponent() {
      const queryClient = useQueryClient();
      const defaultOptions = queryClient.getDefaultOptions();
      
      // Test retry function
      const retry = defaultOptions.queries?.retry as Function;
      const retryDelay = defaultOptions.queries?.retryDelay as Function;
      
      // Should retry on network errors
      const shouldRetry1 = retry(0, new Error('Network error'));
      const shouldRetry2 = retry(1, new Error('Network error'));
      const shouldRetry3 = retry(2, new Error('Network error'));
      const shouldRetry4 = retry(3, new Error('Network error'));
      
      // Should not retry on 4xx errors
      const error4xx = Object.assign(new Error('Client error'), { status: 400 });
      const shouldNotRetry = retry(0, error4xx);
      
      // Test exponential backoff
      const delay1 = retryDelay(0);
      const delay2 = retryDelay(1);
      const delay3 = retryDelay(2);
      
      return (
        <div>
          <div data-testid="retry-1">{String(shouldRetry1)}</div>
          <div data-testid="retry-2">{String(shouldRetry2)}</div>
          <div data-testid="retry-3">{String(shouldRetry3)}</div>
          <div data-testid="retry-4">{String(shouldRetry4)}</div>
          <div data-testid="no-retry-4xx">{String(shouldNotRetry)}</div>
          <div data-testid="delay-1">{delay1}</div>
          <div data-testid="delay-2">{delay2}</div>
          <div data-testid="delay-3">{delay3}</div>
        </div>
      );
    }
    
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    );
    
    // Requirement 29.7: Retry up to 3 times
    expect(screen.getByTestId('retry-1').textContent).toBe('true');
    expect(screen.getByTestId('retry-2').textContent).toBe('true');
    expect(screen.getByTestId('retry-3').textContent).toBe('true');
    expect(screen.getByTestId('retry-4').textContent).toBe('false');
    
    // Should not retry on 4xx errors
    expect(screen.getByTestId('no-retry-4xx').textContent).toBe('false');
    
    // Requirement 29.7: Exponential backoff (1s, 2s, 4s)
    expect(screen.getByTestId('delay-1').textContent).toBe('1000');
    expect(screen.getByTestId('delay-2').textContent).toBe('2000');
    expect(screen.getByTestId('delay-3').textContent).toBe('4000');
  });
});
