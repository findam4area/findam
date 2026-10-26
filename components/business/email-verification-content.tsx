"use client";

/**
 * Email Verification Content Component
 * Client component for email verification with loading states
 * Requirements: 23.4
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const claimId = searchParams.get("claim_id");
      const token = searchParams.get("token");

      if (!claimId || !token) {
        setStatus("error");
        setMessage("Invalid verification link. Missing claim ID or token.");
        return;
      }

      try {
        const response = await fetch("/api/business-claims/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claim_id: claimId,
            token,
            verification_type: "email",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Verification failed");
        }

        setStatus("success");
        setMessage(
          "Email verified successfully! Your claim is now under review. We'll notify you once it's been processed."
        );
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to verify email. The link may have expired."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Verifying your email...
          </h2>
          <p className="mt-2 text-gray-600">Please wait while we verify your email address.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Email Verified!</h2>
          <p className="mt-2 text-gray-600">{message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => router.push("/my-claims")}>View My Claims</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-gray-600">{message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => router.push("/my-claims")}>View My Claims</Button>
            <Button variant="outline" onClick={() => router.push("/businesses")}>
              Browse Businesses
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
