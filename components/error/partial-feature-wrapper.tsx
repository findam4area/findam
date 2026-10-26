"use client";

import { useState, useEffect } from "react";
import { executeWithPartialFallback, trackError } from "@/lib/errors";
import { AlertCircle } from "lucide-react";

interface PartialFeatureWrapperProps {
  /**
   * Critical operations that must succeed
   */
  criticalOperations: Array<() => Promise<any>>;

  /**
   * Non-critical operations that can fail
   */
  nonCriticalOperations?: Array<() => Promise<any>>;

  /**
   * Callback when all operations complete
   */
  onComplete?: (results: any[]) => void;

  /**
   * Callback when critical operations fail
   */
  onCriticalFailure?: (error: Error) => void;

  /**
   * Show warnings for non-critical failures
   */
  showNonCriticalWarnings?: boolean;

  /**
   * Children to render after operations complete
   */
  children: (results: any[]) => React.ReactNode;

  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;
}

/**
 * Component that executes operations with partial functionality fallback
 * Implements Requirement 19.9: Maintain partial functionality when non-critical features fail
 */
export function PartialFeatureWrapper({
  criticalOperations,
  nonCriticalOperations = [],
  onComplete,
  onCriticalFailure,
  showNonCriticalWarnings = true,
  children,
  loadingComponent,
}: PartialFeatureWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [criticalResults, setCriticalResults] = useState<any[]>([]);
  const [nonCriticalErrors, setNonCriticalErrors] = useState<Error[]>([]);
  const [criticalError, setCriticalError] = useState<Error | null>(null);

  useEffect(() => {
    const execute = async () => {
      setIsLoading(true);
      setCriticalError(null);
      setNonCriticalErrors([]);

      try {
        const result = await executeWithPartialFallback(
          criticalOperations,
          nonCriticalOperations
        );

        setCriticalResults(result.criticalResults);
        setNonCriticalErrors(result.errors);
        onComplete?.(result.criticalResults);
      } catch (error) {
        const err = error as Error;
        setCriticalError(err);
        onCriticalFailure?.(err);
        trackError(err, {
          tags: { type: "critical-operation-failed" },
        });
      } finally {
        setIsLoading(false);
      }
    };

    execute();
  }, []);

  if (isLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff41]" />
          </div>
        )}
      </>
    );
  }

  if (criticalError) {
    return (
      <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-red-500/10 p-2 rounded border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Critical feature unavailable
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {criticalError.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showNonCriticalWarnings && nonCriticalErrors.length > 0 && (
        <div className="mb-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-500">
                Some features are unavailable
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {nonCriticalErrors.length} non-critical feature
                {nonCriticalErrors.length > 1 ? "s" : ""} failed to load. Core
                functionality is still available.
              </p>
            </div>
          </div>
        </div>
      )}
      {children(criticalResults)}
    </div>
  );
}
