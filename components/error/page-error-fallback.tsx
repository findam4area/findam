"use client";

import React from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { ErrorFallbackProps } from "./error-boundary";

export function PageErrorFallback({ error, errorInfo, resetError }: ErrorFallbackProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-white">
                Unable to load this page
              </h3>
              <p className="text-sm text-gray-400">
                we're having trouble loading this content. Please try again.
              </p>
              {process.env.NODE_ENV === "development" && error && (
                <div className="mt-3 bg-black/50 rounded p-3 border border-red-500/20">
                  <p className="text-xs text-red-400 font-mono">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={resetError}
              className="flex-1 bg-[#00ff41] hover:bg-[#00cc33] text-black"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex-1 border-gray-700 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
