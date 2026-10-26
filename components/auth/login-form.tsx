/**
 * Login Form Component
 * 
 * Client component providing user login functionality with:
 * - Email and password fields with real-time validation
 * - Field-level error messages displayed immediately on blur
 * - Server error display for authentication failures
 * - Loading state during submission
 * - Links to password reset and registration
 * - Mobile-first design with 44x44px minimum touch targets
 * 
 * Uses Server Action (loginAction) for authentication.
 * 
 * Requirements: 2.1, 2.6, 2.10, 2.11
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth-actions";
import { loginSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/utils/toast";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  /**
   * Validates a single field with Zod schema
   * Requirement 2.6: Real-time validation feedback
   */
  const validateField = (name: string, value: string) => {
    try {
      // Validate the specific field using the login schema
      const fieldSchema = loginSchema.shape[name as keyof typeof loginSchema.shape];
      fieldSchema.parse(value);
      
      // Clear error if validation passes
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name as keyof FieldErrors];
        return updated;
      });
    } catch (error: any) {
      // Set error if validation fails
      if (error.errors && error.errors[0]) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: error.errors[0].message,
        }));
      }
    }
  };

  /**
   * Handle field blur to show validation errors
   * Requirement 2.6: Show field-level errors immediately on blur
   */
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => new Set(prev).add(name));
    validateField(name, value);
  };

  /**
   * Handle field change for real-time validation
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Only validate if field has been touched
    if (touchedFields.has(name)) {
      validateField(name, value);
    }
  };

  /**
   * Handle form submission
   * Requirement 2.1: Complete authentication with validation
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Validate all fields before submission
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      
      const validation = loginSchema.safeParse({ email, password });
      
      if (!validation.success) {
        // Show all validation errors
        const errors: FieldErrors = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof FieldErrors] = err.message;
          }
        });
        setFieldErrors(errors);
        setTouchedFields(new Set(["email", "password"]));
        setIsLoading(false);
        return;
      }

      // Call Server Action
      const result = await loginAction(formData);

      setIsLoading(false);

      if (!result.success) {
        // Display server error prominently (Requirement 2.6)
        setServerError(result.error);
        toastError("Login failed", result.error);
      } else {
        // Success
        toastSuccess("Welcome back!", "You have successfully signed in");
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      setIsLoading(false);
      setServerError("An unexpected error occurred. Please try again.");
      toastError("Login failed", "An unexpected error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Server Error Display - Requirement 2.6: Display server error messages prominently */}
      {serverError && (
        <div 
          className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 flex items-start gap-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-500 flex-1">{serverError}</p>
        </div>
      )}

      {/* Email Field - Requirement 2.1, 2.6 */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
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
          className={`min-h-[44px] ${fieldErrors.email && touchedFields.has("email") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          aria-invalid={!!fieldErrors.email && touchedFields.has("email")}
          aria-describedby={fieldErrors.email && touchedFields.has("email") ? "email-error" : undefined}
        />
        {/* Field-level error - Requirement 2.6: Show field-level errors immediately on blur */}
        {fieldErrors.email && touchedFields.has("email") && (
          <p 
            id="email-error" 
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password Field - Requirement 2.1, 2.6 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          {/* Forgot Password Link - Requirement: Add "Forgot Password?" link to reset page */}
          <Link
            href="/reset-password"
            className="text-sm text-blue-500 hover:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1"
            tabIndex={isLoading ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isLoading}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`min-h-[44px] ${fieldErrors.password && touchedFields.has("password") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          aria-invalid={!!fieldErrors.password && touchedFields.has("password")}
          aria-describedby={fieldErrors.password && touchedFields.has("password") ? "password-error" : undefined}
        />
        {/* Field-level error - Requirement 2.6: Show field-level errors immediately on blur */}
        {fieldErrors.password && touchedFields.has("password") && (
          <p 
            id="password-error" 
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Submit Button - Requirement 2.1: Add submit button with loading state */}
      <Button
        type="submit"
        className="w-full min-h-[44px] text-base font-medium"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Sign Up Link - Requirement: Add "Don't have an account? Sign up" link */}
      <div className="text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-500 hover:text-blue-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1"
            disabled={isLoading}
            tabIndex={isLoading ? -1 : 0}
          >
            Sign up
          </button>
        ) : (
          <Link
            href="/register"
            className="text-blue-500 hover:text-blue-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1"
            tabIndex={isLoading ? -1 : 0}
          >
            Sign up
          </Link>
        )}
      </div>
    </form>
  );
}
