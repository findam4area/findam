import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Web Vitals Monitoring Endpoint
 * 
 * Receives Core Web Vitals metrics from the client:
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - CLS (Cumulative Layout Shift)
 * - FID (First Input Delay)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 * 
 * Stores metrics for analysis and alerting
 * 
 * @route POST /api/monitoring/web-vitals
 */

const WebVitalSchema = z.object({
  name: z.enum(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  delta: z.number().optional(),
  id: z.string(),
  navigationType: z.enum(['navigate', 'reload', 'back-forward', 'back-forward-cache', 'prerender', 'restore']).optional(),
});

const WebVitalsPayloadSchema = z.object({
  metrics: z.array(WebVitalSchema),
  url: z.string().url(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

type WebVitalsPayload = z.infer<typeof WebVitalsPayloadSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate payload
    const validatedData = WebVitalsPayloadSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { metrics, url, userAgent, timestamp, sessionId, userId } = validatedData.data;

    // Extract request metadata
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const country = request.headers.get('x-vercel-ip-country') || 'unknown';

    // Process each metric
    for (const metric of metrics) {
      // Log metrics (in production, send to analytics service like PostHog, Datadog, etc.)
      console.log('[Web Vitals]', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        url,
        timestamp,
        sessionId,
        userId,
        country,
        ip: ip.split(',')[0], // Take first IP if multiple
      });

      // Check if metric exceeds thresholds and send alerts
      if (metric.rating === 'poor') {
        await sendMetricAlert(metric, url, userId);
      }
    }

    // Store metrics in database (optional - can integrate with Supabase or analytics service)
    // await storeMetrics(metrics, url, sessionId, userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Web Vitals Error]', error);
    return NextResponse.json(
      { error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}

/**
 * Send alert for poor-performing metrics
 */
async function sendMetricAlert(
  metric: z.infer<typeof WebVitalSchema>,
  url: string,
  userId?: string
) {
  // In production, integrate with alerting service (PagerDuty, Slack, etc.)
  console.warn('[Performance Alert]', {
    message: `Poor ${metric.name} detected`,
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    url,
    userId,
    timestamp: new Date().toISOString(),
  });

  // Example: Send to Sentry
  // Sentry.captureMessage(`Poor ${metric.name}: ${metric.value}`, {
  //   level: 'warning',
  //   extra: { metric, url, userId },
  // });
}

/**
 * Store metrics in database for historical analysis
 * (Optional - implement based on analytics requirements)
 */
async function storeMetrics(
  metrics: z.infer<typeof WebVitalSchema>[],
  url: string,
  sessionId?: string,
  userId?: string
) {
  // Example implementation with Supabase:
  // const supabase = createClient();
  // await supabase.from('web_vitals').insert(
  //   metrics.map(metric => ({
  //     name: metric.name,
  //     value: metric.value,
  //     rating: metric.rating,
  //     url,
  //     session_id: sessionId,
  //     user_id: userId,
  //     created_at: new Date().toISOString(),
  //   }))
  // );
}
