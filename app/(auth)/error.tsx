"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);

    if (typeof window !== "undefined" && (window as any).__ERROR_TRACKER__) {
      (window as any).__ERROR_TRACKER__.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              <div className="relative bg-red-500/10 p-4 rounded-full border border-red-500/30">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Authentication Error
              </h2>
              <p className="text-gray-400 text-sm">
                We couldn't complete your authentication. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="w-full bg-black/50 rounded-lg p-4 border border-red-500/20">
                <p className="text-xs text-red-400 font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}

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
                  className="w-full border-gray-700 hover:bg-gray-800"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
