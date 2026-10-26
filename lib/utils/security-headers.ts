/**
 * Security headers configuration
 */

/**
 * Content Security Policy (CSP) configuration
 * Helps prevent XSS attacks by controlling which resources can be loaded
 */
export function getContentSecurityPolicy(): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  // CSP directives
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      isDevelopment ? "'unsafe-eval'" : "",
      "'unsafe-inline'", // Required for Next.js
      "https://js.paystack.co", // Paystack payment gateway
    ].filter(Boolean),
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "*.supabase.co", // Supabase storage
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "*.supabase.co", // Supabase API
      "https://api.paystack.co", // Paystack API
      isDevelopment ? "ws://localhost:*" : "",
      isDevelopment ? "http://localhost:*" : "",
    ].filter(Boolean),
    "media-src": ["'self'", "blob:", "*.supabase.co"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": [
      "'self'",
      "https://js.paystack.co", // Paystack iframe
    ],
    "upgrade-insecure-requests": [],
  };

  // Convert directives to CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * All security headers
 */
export function getSecurityHeaders() {
  return [
    {
      key: "X-DNS-Prefetch-Control",
      value: "on",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Frame-Options",
      value: "SAMEORIGIN",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-XSS-Protection",
      value: "1; mode=block",
    },
    {
      key: "Referrer-Policy",
      value: "origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
    },
    {
      key: "Content-Security-Policy",
      value: getContentSecurityPolicy(),
    },
  ];
}

/**
 * CORS configuration
 */
export function getCorsHeaders(origin?: string) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : null,
  ].filter(Boolean) as string[];

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  return [
    {
      key: "Access-Control-Allow-Credentials",
      value: "true",
    },
    {
      key: "Access-Control-Allow-Origin",
      value: isAllowedOrigin ? origin : allowedOrigins[0] || "*",
    },
    {
      key: "Access-Control-Allow-Methods",
      value: "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    },
    {
      key: "Access-Control-Allow-Headers",
      value: [
        "X-CSRF-Token",
        "X-Requested-With",
        "Accept",
        "Accept-Version",
        "Content-Length",
        "Content-MD5",
        "Content-Type",
        "Date",
        "X-Api-Version",
        "Authorization",
      ].join(", "),
    },
    {
      key: "Access-Control-Max-Age",
      value: "86400", // 24 hours
    },
  ];
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  headers: Headers,
  includeCSP = true,
): Headers {
  const securityHeaders = getSecurityHeaders();

  for (const header of securityHeaders) {
    if (!includeCSP && header.key === "Content-Security-Policy") {
      continue;
    }
    headers.set(header.key, header.value);
  }

  return headers;
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(headers: Headers, origin?: string): Headers {
  const corsHeaders = getCorsHeaders(origin);

  for (const header of corsHeaders) {
    headers.set(header.key, header.value);
  }

  return headers;
}
