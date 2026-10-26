/**
 * Error Boundary Component
 * Implements Requirements 19.5, 19.6, 19.7, 19.8
 * 
 * Catches React component errors and displays user-friendly fallback UI.
 * Integrates with Sentry for error tracking with full context.
 */

"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error | null;

  errorInfo?: React.ErrorInfo | null;
  resetError: () => void;
}

/**
 * Error Boundary class component that catches errors in child components
 * Requirement 19.5: Implement error boundaries to prevent full page crashes
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log error to Sentry and call custom error handler
   * Requirement 19.6: Log errors to error tracking service (Sentry) with context
   * Requirement 33.6: Log errors with context (user ID, session, stack trace)
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error info
    this.setState({ errorInfo });

    // Log to console for development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }

    // Requirement 33.6: Log to Sentry with full context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: "true",
        component: this.extractComponentName(errorInfo.componentStack),
      },
      level: "error",
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Extract component name from stack trace for better error context
   */
  private extractComponentName(componentStack: string | null): string {
    if (!componentStack) return "unknown";
    
    const match = componentStack.match(/^\s+at\s+(\w+)/);
    return match ? match[1] : "unknown";
  }

  /**
   * Reset error state to retry rendering
   * Requirement 19.8: Provide retry and recovery options
   */
  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 * Requirement 19.7: Display user-friendly error messages without technical jargon
 * Requirement 19.8: Provide actionable recovery options (retry, refresh, contact support)
 */
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError 
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Error Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              <div className="relative bg-red-500/10 p-4 rounded-full border border-red-500/30">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            {/* Error Message - User-friendly, no technical jargon */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-400 text-sm">
                We encountered an unexpected error. don't worry, we're on it!
                Our team has been notified and will fix this soon.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === "development" && error && (
              <div className="w-full space-y-2">
                <div className="bg-black/50 rounded-lg p-4 border border-red-500/20">
                  <p className="text-xs text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                </div>
                {errorInfo?.componentStack && (
                  <details className="w-full text-left">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-40 bg-black/30 p-2 rounded">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Requirement 19.8: Retry button for error recovery */}
              <Button
                onClick={resetError}
                className="flex-1 bg-gradient-to-r from-[#00ff41] to-[#00cc33] hover:from-[#00cc33] hover:to-[#00ff41] text-black font-semibold"
                aria-label="Try again to reload the content"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              {/* Requirement 19.8: Home navigation option */}
              <Link href="/feed" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-gray-800"
                  aria-label="Go back to homepage"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Contact support link */}
            <div className="text-xs text-gray-500">
              Need help?{" "}
              <Link 
                href="/support" 
                className="text-[#00ff41] hover:underline"
              >
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
