/**
 * Password Reset Request Page
 * 
 * Allows users to request a password reset email.
 * Server Component that renders the password reset request form.
 * 
 * Requirements: 2.8
 */

import { Metadata } from "next";
import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/auth/password-reset-request-form";

export const metadata: Metadata = {
  title: "Reset Password | FindAm",
  description: "Request a password reset for your FindAm account",
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-naija-green to-neon-cyan bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-gray-400">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <PasswordResetRequestForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-naija-green hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
