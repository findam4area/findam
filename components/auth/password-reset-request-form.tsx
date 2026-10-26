/**
 * Password Reset Request Form Component
 * 
 * Client component for requesting password reset emails.
 * Provides email input with validation and displays success/error messages.
 * 
 * Requirements: 2.8
 */

"use client";

import { useState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth-actions";
import { passwordResetRequestSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function PasswordResetRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  /**
   * Validates email field
   */
  const validateField = (value: string) => {
    try {
      passwordResetRequestSchema.parse({ email: value });
      setFieldError(null);
    } catch (err: any) {
      if (err.errors && err.errors[0]) {
        setFieldError(err.errors[0].message);
      }
    }
  };

  /**
   * Handle field blur
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setTouched(true);
    validateField(value);
  };

  /**
   * Handle field change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (touched) {
      validateField(value);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;

      // Validate before submission
      const validation = passwordResetRequestSchema.safeParse({ email });

      if (!validation.success) {
        setFieldError(validation.error.errors[0].message);
        setTouched(true);
        setIsLoading(false);
        return;
      }

      // Call Server Action
      const result = await requestPasswordResetAction(formData);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error);
        toast.error("Request failed", {
          description: result.error,
        });
      } else {
        setSuccess(true);
        toast.success("Email sent!", {
          description: "Check your email for password reset instructions",
        });
        // Reset form
        e.currentTarget.reset();
        setTouched(false);
        setFieldError(null);
      }
    } catch (err) {
      setIsLoading(false);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Request failed", {
        description: "An unexpected error occurred",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Success Message */}
      {success && (
        <div 
          className="rounded-lg bg-green-500/10 border border-green-500/50 p-4 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-500">Email sent!</p>
            <p className="text-sm text-green-400 mt-1">
              Check your email for instructions to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-500 flex-1">{error}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isLoading}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`min-h-[44px] ${fieldError && touched ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          aria-invalid={!!fieldError && touched}
          aria-describedby={fieldError && touched ? "email-error" : undefined}
        />
        {fieldError && touched && (
          <p 
            id="email-error" 
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {fieldError}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full min-h-[44px] text-base font-medium"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>
    </form>
  );
}
