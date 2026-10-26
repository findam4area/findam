"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * Main Layout Error Boundary
 * 
 * Catches and handles errors that occur in the main layout (public-facing pages).
 * Provides user-friendly error messages with navigation to browse/categories.
 * 
 * Requirements: 5.1, 5.2, 5.3
 * - 5.1: Captures client-side JavaScript errors
 * - 5.2: Captures unhandled promise rejections
 * - 5.3: Includes stack trace information for all captured errors
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Requirement 5.3: Log error to Sentry with full stack trace
    Sentry.captureException(error);

    // Log to console for development debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Main layout error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Error Icon with Glow Effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full" />
              <div className="relative bg-yellow-500/10 p-4 rounded-full border border-yellow-500/30">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Something went wrong
              </h2>
              <p className="text-gray-400 text-sm">
                We encountered an error while loading this page. Try refreshing
                or browse our categories to find what you're looking for.
              </p>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === "development" && (
              <div className="w-full bg-black/50 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 font-mono mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={reset}
                className="flex-1 bg-gradient-to-r from-[#00ff41] to-[#00cc33] hover:from-[#00cc33] hover:to-[#00ff41] text-black font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href="/categories" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-gray-800 text-white"
                >
                  <List className="w-4 h-4 mr-2" />
                  Browse Categories
                </Button>
              </Link>
            </div>

            {/* Home Link */}
            <Link href="/" className="w-full">
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
