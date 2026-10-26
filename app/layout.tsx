import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ToastProvider } from "@/components/shared/toast-provider";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { ErrorTrackerInit } from "@/components/error/error-tracker-init";
import { SkipLinks } from "@/components/accessibility/skip-link";
import { PostHogProvider } from "@/lib/analytics/posthog-provider";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsentBanner } from "@/components/gdpr/cookie-consent-banner";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { getAppBaseURL } from "@/lib/utils/url-helpers";

// Configure fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/**
 * Root metadata configuration
 * Requirements: 20.1, 20.2, 20.3, 20.4, 28.1
 */
export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseURL()),

  // Title configuration - Requirement 20.1
  title: {
    default: "FindAm - Nigeria's #1 Youth Marketplace | Buy & Sell",
    template: "%s | FindAm",
  },
  
  // Meta description (under 160 characters) - Requirement 20.2
  description:
    "Join 50,000+ Nigerians buying and selling on FindAm. AI-powered protection, verified sellers, instant chat. Start for free today!",
  
  // Keywords for SEO
  keywords: [
    "Nigeria marketplace",
    "buy and sell Nigeria",
    "online marketplace",
    "classified ads Nigeria",
    "verified sellers",
    "youth marketplace",
    "Lagos marketplace",
    "Abuja marketplace",
  ],
  
  // Authors
  authors: [{ name: "FindAm" }],
  
  // Creator
  creator: "FindAm",
  
  // Publisher
  publisher: "FindAm",
  
  // Manifest
  manifest: "/manifest.json",
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  
  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FindAm",
  },
  
  // Format Detection
  formatDetection: {
    telephone: false,
  },
  
  // Robots - Requirement 28.8
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Open Graph tags for social sharing - Requirement 20.3
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://findam.ng",
    siteName: "FindAm",
    title: "FindAm - Nigeria's #1 Youth Marketplace",
    description:
      "Join 50,000+ Nigerians buying and selling on FindAm. AI-powered protection, verified sellers, instant chat.",
    images: [
      {
        url: "/api/og?title=FindAm - Nigeria's #1 Youth Marketplace&description=Buy, sell, and discover amazing deals",
        width: 1200,
        height: 630,
        alt: "FindAm - Nigeria's #1 Youth Marketplace",
      },
    ],
  },
  
  // Twitter Card tags - Requirement 20.4
  twitter: {
    card: "summary_large_image",
    site: "@FindAmNG",
    creator: "@FindAmNG",
    title: "FindAm - Nigeria's #1 Youth Marketplace",
    description:
      "Join 50,000+ Nigerians buying and selling on FindAm. AI-powered protection, verified sellers, instant chat.",
    images: ["/api/og?title=FindAm - Nigeria's #1 Youth Marketplace&description=Buy, sell, and discover amazing deals"],
  },
  
  // Verification
  verification: {
    google: "your-google-verification-code",
  },
  
  // Alternate languages (if applicable) - Requirement 28.7
  alternates: {
    canonical: "https://findam.ng",
  },
  
  // Category
  category: "marketplace",
};

export const viewport: Viewport = {
  themeColor: "#00C853",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-body`}
        suppressHydrationWarning
      >
        <SkipLinks />
        <RegisterServiceWorker />
        <QueryProvider>
          <AuthProvider>
            <PostHogProvider>
              <SmoothScrollProvider>
                <ErrorTrackerInit />
                <OfflineIndicator />
                {children}
                <ToastProvider />
                <Analytics />
                <CookieConsentBanner />
                <InstallPrompt />
              </SmoothScrollProvider>
            </PostHogProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
