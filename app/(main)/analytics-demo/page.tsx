'use client';

/**
 * Analytics Demo Page
 * Demonstrates all analytics and A/B testing features
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.6, 30.1, 30.2, 30.3, 30.6, 30.7
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  trackEvent,
  trackSearch,
  trackFilter,
  trackSave,
  trackShare,
  trackContact,
  trackFunnelStep,
  identifyUser,
  setUserProperties,
} from '@/lib/analytics';
import { useABTest, useFeatureFlag } from '@/lib/analytics/use-ab-test';
import { useScrollDepth } from '@/lib/analytics/use-scroll-depth';
import { FEATURE_FLAGS, AB_TESTS } from '@/lib/analytics/feature-flags';

export default function AnalyticsDemoPage() {
  // Track scroll depth
  useScrollDepth();
  
  // Example A/B tests
  const heroVariant = useABTest(AB_TESTS.HOMEPAGE_HERO_VARIANT, 'control');
  const ctaText = useABTest(AB_TESTS.CTA_BUTTON_TEXT, 'Get Started');
  
  // Example feature flags
  const isVideoEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_VIDEO_LISTINGS, false);
  const isBoostEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_BOOST, true);
  
  const [trackingLog, setTrackingLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTrackingLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">Analytics & A/B Testing Demo</h1>
          <p className="text-muted-foreground">
            This page demonstrates all analytics, A/B testing, and GDPR features implemented
            for the sophisticated marketplace homepage.
          </p>
        </div>

        {/* A/B Testing Demo */}
        <Card>
          <CardHeader>
            <CardTitle>A/B Testing (Subtask 16.2)</CardTitle>
            <CardDescription>
              Feature flags and A/B test variants are loaded from PostHog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm font-medium mb-2">Hero Variant Test</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Your assigned variant: <strong>{heroVariant}</strong>
                </p>
                <div className={`p-3 rounded ${
                  heroVariant === 'variant_a' ? 'bg-blue-500/10 border border-blue-500' :
                  heroVariant === 'variant_b' ? 'bg-green-500/10 border border-green-500' :
                  'bg-gray-500/10 border border-gray-500'
                }`}>
                  {heroVariant === 'variant_a' && '🎨 Variant A: Colorful Design'}
                  {heroVariant === 'variant_b' && '✨ Variant B: Minimal Design'}
                  {heroVariant === 'control' && '📊 Control: Default Design'}
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm font-medium mb-2">CTA Button Text Test</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Your assigned variant: <strong>{ctaText}</strong>
                </p>
                <Button className="w-full">{ctaText}</Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Feature Flags</p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  isVideoEnabled ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                }`}>
                  Video Listings: {isVideoEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  isBoostEnabled ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                }`}>
                  Boost: {isBoostEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Event Tracking Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Event Tracking (Subtask 16.1)</CardTitle>
            <CardDescription>
              Track user interactions with custom events sent to PostHog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  trackSearch('laptop', 42);
                  addLog('Tracked search: "laptop" with 42 results');
                }}
              >
                Track Search
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  trackFilter('category', 'electronics');
                  addLog('Tracked filter: category = electronics');
                }}
              >
                Track Filter
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  trackSave('listing-123', 'MacBook Pro');
                  addLog('Tracked save: MacBook Pro');
                }}
              >
                Track Save
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  trackShare('listing-123', 'MacBook Pro', 'whatsapp');
                  addLog('Tracked share: MacBook Pro via WhatsApp');
                }}
              >
                Track Share
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  trackContact('vendor-456', 'listing-123');
                  addLog('Tracked contact: vendor-456');
                }}
              >
                Track Contact
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  trackEvent('custom_event', { foo: 'bar', count: 42 });
                  addLog('Tracked custom event with properties');
                }}
              >
                Custom Event
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  identifyUser('user-789', { name: 'Test User', plan: 'pro' });
                  addLog('Identified user with properties');
                }}
              >
                Identify User
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUserProperties({ theme: 'dark', language: 'en' });
                  addLog('Set user properties');
                }}
              >
                Set Properties
              </Button>
            </div>

            {/* Tracking Log */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Event Log:</p>
              <div className="bg-secondary rounded-lg p-4 h-32 overflow-y-auto font-mono text-xs">
                {trackingLog.length === 0 ? (
                  <p className="text-muted-foreground">Click buttons above to track events...</p>
                ) : (
                  trackingLog.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel Tracking (Subtask 16.1)</CardTitle>
            <CardDescription>
              Track user journey through the conversion funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    trackFunnelStep('view', 'listing-123');
                    addLog('Funnel: View listing');
                  }}
                >
                  1. View Listing
                </Button>
                <span className="text-muted-foreground">→</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    trackFunnelStep('click', 'listing-123');
                    addLog('Funnel: Click listing');
                  }}
                >
                  2. Click Details
                </Button>
                <span className="text-muted-foreground">→</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    trackFunnelStep('contact', 'listing-123');
                    addLog('Funnel: Contact vendor');
                  }}
                >
                  3. Contact
                </Button>
                <span className="text-muted-foreground">→</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    trackFunnelStep('purchase', 'listing-123', { amount: 500000 });
                    addLog('Funnel: Purchase complete');
                  }}
                >
                  4. Purchase
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                These events track the complete conversion funnel from view to purchase,
                enabling funnel analysis and conversion rate optimization.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scroll Depth Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Scroll Depth Tracking (Subtask 16.2)</CardTitle>
            <CardDescription>
              Automatically tracks when users scroll to 25%, 50%, 75%, and 100% of the page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Scroll down this page to trigger scroll depth tracking events. Check your browser
              console or PostHog dashboard to see the events.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">25% depth tracked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">50% depth tracked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm">75% depth tracked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">100% depth tracked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GDPR Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>GDPR Compliance (Subtask 16.4)</CardTitle>
            <CardDescription>
              Data export, deletion, and privacy controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Data Export</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Users can export their data in JSON or CSV format (GDPR Article 20: Right to Data Portability)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open('/api/gdpr/export?format=json', '_blank');
                      addLog('Initiated data export (JSON)');
                    }}
                  >
                    Export as JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open('/api/gdpr/export?format=csv', '_blank');
                      addLog('Initiated data export (CSV)');
                    }}
                  >
                    Export as CSV
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Data Deletion</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Users can request account deletion with a 30-day grace period (GDPR Article 17: Right to be Forgotten)
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    const confirmed = confirm(
                      'This will schedule your account for deletion in 30 days. Continue?'
                    );
                    if (confirmed) {
                      try {
                        const response = await fetch('/api/gdpr/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'schedule', gracePeriodDays: 30 }),
                        });
                        const data = await response.json();
                        addLog(`Data deletion scheduled: ${data.scheduledDate}`);
                      } catch (error) {
                        addLog('Error scheduling deletion');
                      }
                    }
                  }}
                >
                  Schedule Account Deletion
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Cookie Consent</p>
                <p className="text-xs text-muted-foreground">
                  Cookie consent banner is displayed on first visit and respects user preferences
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-700">
                    ✓ Necessary Cookies
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-700">
                    ✓ Analytics Cookies
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-700">
                    ✓ Marketing Cookies
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Summary</CardTitle>
            <CardDescription>
              All requirements from Task 16 have been implemented
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">✅ Subtask 16.1: Analytics Integration</h3>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Vercel Analytics integrated for performance monitoring</li>
                  <li>• PostHog integrated for user behavior tracking</li>
                  <li>• Custom event tracking (search, filter, save, share, contact)</li>
                  <li>• Conversion funnel tracking (view → click → contact → purchase)</li>
                  <li>• User identification and property tracking</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">✅ Subtask 16.2: A/B Testing Framework</h3>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Feature flags for gradual rollout</li>
                  <li>• A/B test variant assignment with consistency guarantee</li>
                  <li>• Scroll depth tracking (25%, 50%, 75%, 100%)</li>
                  <li>• Cohort analysis for retention metrics</li>
                  <li>• React hooks for easy integration (useABTest, useFeatureFlag, useScrollDepth)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">✅ Subtask 16.4: GDPR Compliance</h3>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Cookie consent banner with granular controls</li>
                  <li>• Data export functionality (JSON and CSV formats)</li>
                  <li>• Data deletion workflow with grace period</li>
                  <li>• Privacy preference management</li>
                  <li>• Respect for Do Not Track (DNT) headers</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-secondary rounded-lg">
                <p className="text-sm font-medium mb-2">Requirements Satisfied:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">18.1</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">18.2</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">18.3</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">18.4</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">18.9</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">30.1</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">30.2</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">30.3</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">30.6</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">30.7</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">30.10</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">31.6</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">31.7</span>
                  <span className="px-2 py-1 rounded text-xs bg-primary/20">31.8</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacer for scroll depth testing */}
        <div className="h-screen flex items-center justify-center bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">Scroll past this section to test 100% depth tracking</p>
        </div>
      </div>
    </div>
  );
}
