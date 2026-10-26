import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { buildCSPForEnvironment } from "./lib/security/csp-builder";
import { withSentryConfig } from "@sentry/nextjs";

// Bundle analyzer (optional)
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

// Configure PWA
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Homepage caching (Requirement 17.1)
      {
        urlPattern: /^\/$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "homepage-cache",
          expiration: {
            maxEntries: 1,
            maxAgeSeconds: 60, // 60 seconds (matches ISR revalidation)
          },
          networkTimeoutSeconds: 3,
        },
      },
      // Dynamic API content - Network First (Requirement 17.5)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-cache",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      // Static images - Cache First (Requirement 17.5)
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cloudinary-images",
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Static images - Cache First (Requirement 17.5)
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-images",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // Static resources - Cache First (Requirement 17.5)
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      // Google Fonts - Cache First (Requirement 17.5)
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // API listings - Network First (Requirement 17.5)
      {
        urlPattern: /\/api\/listings/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-listings",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          networkTimeoutSeconds: 10,
        },
      },
      // API deals - Network First (Requirement 17.5)
      {
        urlPattern: /\/api\/deals/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-deals",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // TypeScript validation
  // Note: Full type checking is memory-intensive and done in separate CI/CD step
  // Use 'npm run type-check' for local type validation
  typescript: {
    // Skip during build to avoid memory issues
    // Run 'npm run type-check' separately for type validation
    ignoreBuildErrors: true,
  },

  // Production optimizations (Requirement 15.1, 16.8)
  // Requirement 7.2: Disable public source maps in production for security
  // Source maps are still generated and uploaded to Sentry via the Sentry Webpack plugin
  // but are not exposed in the public build output
  productionBrowserSourceMaps: false, // Disable source maps in production for security

  // Compression enabled by default in Next.js 16
  // Vercel handles compression automatically
  compress: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Image optimization for production
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
    // Reduce filesystem polling for better performance on Windows
    webpackBuildWorker: true,
  },

  // Add empty turbopack config to silence warning
  turbopack: {},

  // Optimize filesystem watching for Windows
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    // Enable React optimizations
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  // Output configuration for production
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Power off X-Powered-By header for security
  poweredByHeader: false,

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Security headers (Requirements 1.1-1.7, 2.1-2.8)
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";

    // Content Security Policy - Build using CSP builder function
    // Requirements 2.1-2.8: Environment-aware CSP with support for Paystack, Supabase, and localhost dev
    const cspDirectives = buildCSPForEnvironment();

    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Requirement 1.4: HSTS with 2-year max-age for production
          {
            key: "Strict-Transport-Security",
            value: isProduction
              ? "max-age=63072000; includeSubDomains; preload"
              : "max-age=0",
          },
          // Requirement 1.2: X-Frame-Options set to SAMEORIGIN
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Requirement 1.3: X-Content-Type-Options set to nosniff
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Requirement 1.5: Referrer-Policy header
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          // Requirement 1.6: Permissions-Policy restricting camera, microphone, and geolocation
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
          // Requirement 1.1: Content-Security-Policy header for all responses
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
        ],
      },
      {
        // CORS headers for API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

// Wrap config with Sentry for source map upload and error tracking
// Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6: Configure source map upload to Sentry
// Requirement 7.6: Only upload source maps in production builds to save quota
export default withSentryConfig(
  withBundleAnalyzer(withPWA(nextConfig)),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Requirement 7.1: Sentry Webpack plugin configuration for source map upload
    // Requirement 7.6: Only upload in production to avoid wasting quota on dev builds
    silent: !process.env.CI, // Show upload logs in CI for debugging
    
    // Organization and project from environment variables or sentry.properties
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Requirement 7.5: Authentication token for uploading source maps
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Requirement 7.3: Release tagging with git commit SHA
    release: {
      name: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    },

    // Requirement 7.6: Disable source map upload in development
    disableServerWebpackPlugin: process.env.NODE_ENV !== "production",
    disableClientWebpackPlugin: process.env.NODE_ENV !== "production",

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the Sentry DSN is configured and available.
    tunnelRoute: "/monitoring",

    // Requirement 7.2: Hides source maps from generated client bundles
    // Prevents public exposure of source maps while still uploading to Sentry
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
