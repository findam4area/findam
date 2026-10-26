/**
 * Extended Health Check Endpoint with Detailed Metrics
 * 
 * Provides comprehensive health status including:
 * - Service health checks
 * - Performance metrics
 * - System resource usage
 * - Recent error counts
 * 
 * Requirements: 33.5, 33.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  HEALTH_CHECK_CONFIG,
  isCriticalService,
} from '@/lib/monitoring/config';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
  timestamp: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: Record<string, HealthCheck>;
  responseTime: number;
  environment: string;
  version: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  const checks: Record<string, HealthCheck> = {};

  // 1. Database connectivity check
  await checkDatabase(checks);

  // 2. Storage check
  await checkStorage(checks);

  // 3. API responsiveness check
  checks.api = {
    status: 'healthy',
    latency: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };

  // 4. Memory usage check
  checkMemoryUsage(checks);

  // Determine overall health status
  const hasUnhealthyServices = Object.entries(checks).some(
    ([name, check]) => check.status === 'unhealthy' && isCriticalService(name)
  );
  const allHealthy = Object.values(checks).every(
    (check) => check.status === 'healthy'
  );

  const overallStatus = hasUnhealthyServices
    ? 'unhealthy'
    : allHealthy
      ? 'healthy'
      : 'degraded';

  const responseBody: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime,
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  };

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(responseBody, { status: httpStatus });
}

/**
 * Check database connectivity
 */
async function checkDatabase(checks: Record<string, HealthCheck>) {
  try {
    const dbStartTime = Date.now();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('listings')
      .select('id')
      .limit(1)
      .single();

    const dbLatency = Date.now() - dbStartTime;

    if (error && error.code !== 'PGRST116') {
      checks.database = {
        status: 'unhealthy',
        latency: dbLatency,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } else {
      checks.database = {
        status: 'healthy',
        latency: dbLatency,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check storage connectivity
 */
async function checkStorage(checks: Record<string, HealthCheck>) {
  try {
    const storageStartTime = Date.now();
    const supabase = await createClient();
    
    const { error } = await supabase.storage.getBucket('listings');

    const storageLatency = Date.now() - storageStartTime;

    if (error) {
      checks.storage = {
        status: 'degraded',
        latency: storageLatency,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } else {
      checks.storage = {
        status: 'healthy',
        latency: storageLatency,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    checks.storage = {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown storage error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check memory usage
 */
function checkMemoryUsage(checks: Record<string, HealthCheck>) {
  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    // Flag if memory usage is high
    const status =
      heapUsagePercent > 90
        ? 'unhealthy'
        : heapUsagePercent > 75
          ? 'degraded'
          : 'healthy';

    checks.memory = {
      status,
      latency: Math.round(heapUsedMB),
      error:
        status !== 'healthy'
          ? `High memory usage: ${heapUsagePercent.toFixed(1)}%`
          : undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    checks.memory = {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown memory error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Lightweight readiness probe
 * Used by load balancers and orchestrators
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
