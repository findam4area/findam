"use client";

/**
 * BrowsePage Error Boundary
 * 
 * Catches and handles errors that occur in the Browse Categories page.
 * Provides user-friendly error messages with recovery options.
 * 
 * Requirements: 12.5, 12.6, 16.28, 16.29, 16.30
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BrowseErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BrowseError({ error, reset }: BrowseErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Browse page error:", error);

    // Track error if error tracking is available
    if (typeof window !== "undefined" && (window as any).__ERROR_TRACKER__) {
      (window as any).__ERROR_TRACKER__.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header to maintain layout consistency */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Browse Categories
          </h1>
          <p className="text-gray-400">
            Discover services, businesses, and opportunities across Nigeria
          </p>
        </div>
      </header>

      {/* Error Content */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Error Icon with Glow Effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                <div className="relative bg-red-500/10 p-4 rounded-full border border-red-500/30">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Unable to Load Categories
                </h2>
                <p className="text-gray-400 text-sm">
                  We encountered an error while loading the categories. Please try again or return to the homepage.
                </p>
              </div>

              {/* Development Error Details */}
              {process.env.NODE_ENV === "development" && (
                <div className="w-full bg-black/50 rounded-lg p-4 border border-red-500/20">
                  <p className="text-xs text-red-400 font-mono break-all">
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
                <Link href="/" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 hover:bg-gray-800 text-white"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}