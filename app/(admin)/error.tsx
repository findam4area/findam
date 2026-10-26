"use client";

import { useEffect } from "react";
import { PageErrorFallback } from "@/components/error";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);

    if (typeof window !== "undefined" && (window as any).__ERROR_TRACKER__) {
      (window as any).__ERROR_TRACKER__.captureException(error);
    }
  }, [error]);

  return <PageErrorFallback error={error} errorInfo={undefined} resetError={reset} />;
}
