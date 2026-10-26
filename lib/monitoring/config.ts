/**
 * Monitoring and Health Check Configuration
 * 
 * Centralized configuration for:
 * - Health check endpoints
 * - Core Web Vitals thresholds
 * - Performance monitoring
 * - Alerting rules
 * 
 * Requirements: 33.5, 33.7, 33.9
 */

/**
 * Core Web Vitals Thresholds
 * Based on Google's recommendations and requirements 8.1, 8.2, 8.3
 */
export const WEB_VITALS_THRESHOLDS = {
  FCP: {
    good: 1500, // Requirement 8.1: FCP < 1.5s on 3G
    needsImprovement: 3000,
    poor: 3000,
  },
  LCP: {
    good: 2500, // Requirement 8.2: LCP < 2.5s on 3G
    needsImprovement: 4000,
    poor: 4000,
  },
  CLS: {
    good: 0.1, // Requirement 8.3: CLS < 0.1
    needsImprovement: 0.25,
    poor: 0.25,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
    poor: 300,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
    poor: 1800,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
    poor: 500,
  },
} as const;

/**
 * Health Check Configuration
 */
export const HEALTH_CHECK_CONFIG = {
  // Endpoint paths
  endpoints: {
    health: '/api/health',
    readiness: '/api/health', // HEAD request
    liveness: '/api/health', // Lightweight check
  },
  
  // Timeout settings (ms)
  timeouts: {
    database: 5000,
    storage: 3000,
    api: 2000,
  },
  
  // Critical services that must be healthy
  criticalServices: ['database', 'api'],
  
  // Non-critical services that can be degraded
  nonCriticalServices: ['storage'],
} as const;

/**
 * Performance Monitoring Configuration
 */
export const PERFORMANCE_MONITORING_CONFIG = {
  // Enable/disable monitoring
  enabled: process.env.NODE_ENV === 'production',
  
  // Sample rate for performance data (0.0 to 1.0)
  sampleRate: parseFloat(process.env.PERFORMANCE_SAMPLE_RATE || '1.0'),
  
  // Metrics collection interval (ms)
  collectionInterval: 60000, // 1 minute
  
  // Resource timing thresholds
  resourceThresholds: {
    slowResourceMs: 1000,
    verySlowResourceMs: 3000,
  },
  
  // Page load thresholds
  pageLoadThresholds: {
    good: 2000,
    needsImprovement: 4000,
    poor: 4000,
  },
  
  // API response time thresholds
  apiResponseThresholds: {
    good: 200,
    needsImprovement: 500,
    poor: 500,
  },
} as const;

/**
 * Alerting Configuration
 */
export const ALERTING_CONFIG = {
  // Enable/disable alerts
  enabled: process.env.NODE_ENV === 'production',
  
  // Alert thresholds
  thresholds: {
    // Alert if X% of users experience poor metrics
    poorMetricPercentage: 5,
    
    // Alert if health check fails X times in a row
    consecutiveHealthCheckFailures: 3,
    
    // Alert if error rate exceeds X%
    errorRatePercentage: 1,
    
    // Alert if API response time exceeds X ms (p95)
    apiResponseTimeP95Ms: 1000,
  },
  
  // Alert channels (configure in environment)
  channels: {
    slack: process.env.SLACK_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    pagerduty: process.env.PAGERDUTY_API_KEY,
  },
  
  // Cooldown period between alerts (ms)
  cooldownPeriod: 300000, // 5 minutes
} as const;

/**
 * Smoke Test Configuration
 * Requirements: 33.9
 */
export const SMOKE_TEST_CONFIG = {
  // Critical paths to test
  criticalPaths: [
    '/',
    '/api/health',
    '/api/listings/featured',
    '/api/categories',
  ],
  
  // Maximum allowed response time (ms)
  maxResponseTime: 10000,
  
  // Required HTTP status codes
  expectedStatus: {
    '/': 200,
    '/api/health': 200,
    '/api/listings/featured': 200,
    '/api/categories': 200,
  },
  
  // Run smoke tests after deployment
  runOnDeploy: true,
  
  // Fail deployment if smoke tests fail
  blockDeploymentOnFailure: true,
} as const;

/**
 * Monitoring Endpoints to Track
 */
export const MONITORED_ENDPOINTS = [
  { path: '/api/health', critical: true },
  { path: '/api/listings/featured', critical: true },
  { path: '/api/categories', critical: true },
  { path: '/api/search', critical: true },
  { path: '/api/monitoring/web-vitals', critical: false },
  { path: '/api/analytics/performance', critical: false },
] as const;

/**
 * Check if a metric value is within acceptable range
 */
export function isMetricHealthy(
  metricName: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number
): boolean {
  const threshold = WEB_VITALS_THRESHOLDS[metricName];
  return value <= threshold.good;
}

/**
 * Get metric rating based on thresholds
 */
export function getMetricRating(
  metricName: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = WEB_VITALS_THRESHOLDS[metricName];
  
  if (value <= threshold.good) {
    return 'good';
  }
  if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Check if a service is critical
 */
export function isCriticalService(serviceName: string): boolean {
  return HEALTH_CHECK_CONFIG.criticalServices.includes(serviceName);
}

/**
 * Check if alerts should be sent
 */
export function shouldSendAlert(): boolean {
  return ALERTING_CONFIG.enabled && 
         (!!ALERTING_CONFIG.channels.slack || 
          !!ALERTING_CONFIG.channels.email || 
          !!ALERTING_CONFIG.channels.pagerduty);
}
