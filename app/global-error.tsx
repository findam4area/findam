"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to error tracking service
    console.error("Global error:", error);

    if (typeof window !== "undefined" && (window as any).__ERROR_TRACKER__) {
      (window as any).__ERROR_TRACKER__.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body>
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

                {/* Error Message */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    Application Error
                  </h2>
                  <p className="text-gray-400 text-sm">
                    A critical error occurred. Please refresh the page.
                  </p>
                </div>

                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="w-full bg-black/50 rounded-lg p-4 border border-red-500/20">
                    <p className="text-xs text-red-400 font-mono break-all">
                      {error.message}
                    </p>
                    {error.digest && (
                      <p className="text-xs text-gray-500 mt-2">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={reset}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#00ff41] to-[#00cc33] hover:from-[#00cc33] hover:to-[#00ff41] text-black font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
