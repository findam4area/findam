import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health Check Endpoint
 * 
 * Verifies system health including:
 * - Database connectivity
 * - External service availability
 * - Basic API functionality
 * 
 * Returns 200 OK when all systems operational
 * Returns 503 Service Unavailable when critical systems are down
 * 
 * @route GET /api/health
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'unhealthy' | 'degraded'; latency?: number; error?: string }> = {};

  // 1. Database connectivity check
  try {
    const dbStartTime = Date.now();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('listings')
      .select('id')
      .limit(1)
      .single();

    const dbLatency = Date.now() - dbStartTime;

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned", which is acceptable
      checks.database = {
        status: 'unhealthy',
        latency: dbLatency,
        error: error.message,
      };
    } else {
      checks.database = {
        status: 'healthy',
        latency: dbLatency,
      };
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // 2. Supabase Storage check
  try {
    const storageStartTime = Date.now();
    const supabase = await createClient();
    const { data, error } = await supabase.storage.getBucket('listings');

    const storageLatency = Date.now() - storageStartTime;

    if (error) {
      checks.storage = {
        status: 'degraded',
        latency: storageLatency,
        error: error.message,
      };
    } else {
      checks.storage = {
        status: 'healthy',
        latency: storageLatency,
      };
    }
  } catch (error) {
    checks.storage = {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown storage error',
    };
  }

  // 3. API responsiveness check (self-check)
  checks.api = {
    status: 'healthy',
    latency: Date.now() - startTime,
  };

  // Determine overall health status
  const hasUnhealthyServices = Object.values(checks).some(check => check.status === 'unhealthy');
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  const overallStatus = hasUnhealthyServices ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded';

  const responseBody = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime,
  };

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(responseBody, { status: httpStatus });
}

/**
 * Lightweight readiness probe
 * 
 * Returns 200 OK if the service is ready to accept traffic
 * Used by load balancers and orchestrators
 * 
 * @route HEAD /api/health
 */
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('listings')
      .select('id')
      .limit(1)
      .single();

    // If we can query the database, we're ready
    if (error && error.code !== 'PGRST116') {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
