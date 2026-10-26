import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitConfig, RATE_LIMITS } from "./rate-limit";
import { createClient } from "@/lib/supabase/server";

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(
  request: NextRequest,
  userId?: string,
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Apply rate limiting to an API route
 * Returns null if rate limit passed, or a 429 response if exceeded
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string,
): NextResponse | null {
  const identifier = getClientIdentifier(request, userId);
  const result = checkRateLimit(identifier, config);

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.uniqueTokenPerInterval.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
        },
      },
    );
  }

  return null;
}

/**
 * Check if user is authenticated
 * Returns user object or null
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Require authentication for an API route
 * Returns user object or a 401 response
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ user: any } | NextResponse> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Authentication required" },
      { status: 401 },
    );
  }

  return { user };
}

/**
 * Apply different rate limits based on authentication status
 */
export async function applyAdaptiveRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const user = await getAuthenticatedUser(request);
  const config = user ? RATE_LIMITS.AUTHENTICATED : RATE_LIMITS.ANONYMOUS;

  return applyRateLimit(request, config, user?.id);
}
