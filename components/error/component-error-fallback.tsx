"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { ErrorFallbackProps } from "./error-boundary";

interface ComponentErrorFallbackProps extends ErrorFallbackProps {
  componentName?: string;
}

export function ComponentErrorFallback({
  error,
  errorInfo,
  resetError,
  componentName = "Component",
}: ComponentErrorFallbackProps) {
  return (
    <div className="bg-gray-900/20 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            {componentName} failed to load
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Try refreshing the page or{" "}
            <button
              onClick={resetError}
              className="text-[#00ff41] hover:underline"
            >
              click here to retry
            </button>
          </p>
        </div>
      </div>
      {process.env.NODE_ENV === "development" && error && (
        <div className="mt-3 bg-black/50 rounded p-2 border border-yellow-500/20">
          <p className="text-xs text-yellow-400 font-mono break-all">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
