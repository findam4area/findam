/**
 * Email Verification Page for Business Claims
 * Handles email verification links from claim emails
 * Requirements: 23.4
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { EmailVerificationContent } from "@/components/business/email-verification-content";

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <EmailVerificationContent />
      </Suspense>
    </div>
  );
}
