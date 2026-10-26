import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import type { Metadata } from "next";

/**
 * SEO metadata for login page
 * Requirement 2.11: Proper metadata for SEO
 */
export const metadata: Metadata = {
  title: "Login | FindAm - Youth Services Directory",
  description: "Sign in to FindAm to access youth services and opportunities across Nigeria. Connect with trusted businesses and discover what you need.",
  openGraph: {
    title: "Login | FindAm",
    description: "Sign in to access youth services and opportunities across Nigeria",
    type: "website",
  },
};

/**
 * Login page - Server Component
 * Requirement 2.1, 2.11: Create authentication pages with Next.js 16 App Router
 * Requirement 3.6: Redirect authenticated users away from auth pages
 */
export default async function LoginPage() {
  // Check if user is already authenticated
  // Requirement 3.6: Redirect authenticated users away from auth pages
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // User is already logged in, redirect to homepage
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-naija-green to-neon-cyan bg-clip-text text-transparent mb-2">
              FindAm
            </h1>
            <p className="text-gray-400">Welcome back! Sign in to continue</p>
          </div>

          <LoginForm />

          <OAuthButtons />

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <Link
                href="/reset-password"
                className="text-sm text-gray-400 hover:text-naija-green transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-naija-green hover:underline font-medium"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
