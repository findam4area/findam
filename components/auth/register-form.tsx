"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/utils/toast";
import { motion } from "framer-motion";
import Link from "next/link";

// Registration schema matching requirements: email, password (8+ chars, uppercase, lowercase, digit), full_name
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain digit"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
});

type RegisterInput = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

// Password strength calculation
function calculatePasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  label: string;
  color: string;
} {
  if (!password || password.length === 0) {
    return { strength: "weak", label: "Weak", color: "bg-red-500" };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { strength: "weak", label: "Weak", color: "bg-red-500" };
  } else if (score <= 4) {
    return { strength: "medium", label: "Medium", color: "bg-yellow-500" };
  } else {
    return { strength: "strong", label: "Strong", color: "bg-green-500" };
  }
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange", // Enable real-time validation
  });

  // Watch password field for strength indicator
  const password = watch("password", "");
  const passwordStrength = calculatePasswordStrength(password);

  // Validation requirements check
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    // Use full_name as username for now (the backend expects username)
    // This will be updated when the backend schema is updated to match requirements
    const username = data.full_name.toLowerCase().replace(/\s+/g, "_");

    const { error: signUpError } = await signUp(
      data.email,
      data.password,
      username,
      undefined, // phone is optional
    );

    setIsLoading(false);

    if (signUpError) {
      // Check for specific error types
      if (signUpError.message.includes("already")) {
        setError("This email is already registered. Please log in instead.");
      } else {
        setError(signUpError.message);
      }
      toastError("Registration failed", signUpError.message);
    } else {
      toastSuccess("Account created successfully!", "Welcome to FindAm. Please check your email to verify your account.");
      onSuccess?.();
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Email Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          disabled={isLoading}
          className="w-full min-h-[44px] text-base" // Mobile-first: 44px touch target
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <motion.p
            id="email-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            <X className="h-3 w-3" />
            {errors.email.message}
          </motion.p>
        )}
      </motion.div>

      {/* Full Name Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <Label htmlFor="full_name" className="text-sm font-medium">
          Full Name
        </Label>
        <Input
          id="full_name"
          type="text"
          placeholder="John Doe"
          {...register("full_name")}
          disabled={isLoading}
          className="w-full min-h-[44px] text-base" // Mobile-first: 44px touch target
          aria-invalid={errors.full_name ? "true" : "false"}
          aria-describedby={errors.full_name ? "full_name-error" : undefined}
        />
        {errors.full_name && (
          <motion.p
            id="full_name-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            <X className="h-3 w-3" />
            {errors.full_name.message}
          </motion.p>
        )}
      </motion.div>

      {/* Password Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={isLoading}
          className="w-full min-h-[44px] text-base" // Mobile-first: 44px touch target
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby="password-requirements"
        />

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${passwordStrength.color} transition-all duration-300`}
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      passwordStrength.strength === "weak"
                        ? "33%"
                        : passwordStrength.strength === "medium"
                          ? "66%"
                          : "100%",
                  }}
                />
              </div>
              <span className="text-xs font-medium min-w-[60px]">
                {passwordStrength.label}
              </span>
            </div>
          </motion.div>
        )}

        {/* Password Requirements */}
        <div
          id="password-requirements"
          className="space-y-1 text-xs p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700"
        >
          <p className="font-medium mb-2">Password must contain:</p>
          <div className="space-y-1">
            <div
              className={`flex items-center gap-2 ${
                hasMinLength ? "text-green-600" : "text-gray-500"
              }`}
            >
              {hasMinLength ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>At least 8 characters</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                hasUppercase ? "text-green-600" : "text-gray-500"
              }`}
            >
              {hasUppercase ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>One uppercase letter (A-Z)</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                hasLowercase ? "text-green-600" : "text-gray-500"
              }`}
            >
              {hasLowercase ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>One lowercase letter (a-z)</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                hasDigit ? "text-green-600" : "text-gray-500"
              }`}
            >
              {hasDigit ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>One digit (0-9)</span>
            </div>
          </div>
        </div>

        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 flex items-center gap-1"
            role="alert"
          >
            <X className="h-3 w-3" />
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      {/* Server Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-md bg-red-500/10 border border-red-500/50 p-3"
          role="alert"
        >
          <p className="text-sm text-red-500">{error}</p>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <Button
          type="submit"
          className="w-full min-h-[44px]" // Mobile-first: 44px touch target
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </motion.div>

      {/* Login Link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="text-center text-sm text-gray-600 dark:text-gray-400"
      >
        Already have an account?{" "}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
          >
            Log in
          </button>
        ) : (
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
          >
            Log in
          </Link>
        )}
      </motion.p>
    </motion.form>
  );
}
