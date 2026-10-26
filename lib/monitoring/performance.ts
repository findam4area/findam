/**
 * Performance monitoring utilities
 * Requirements: Performance optimization
 *
 * Tracks Core Web Vitals and custom performance metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
}

/**
 * Core Web Vitals thresholds
 */
const THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    poor: 1800,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    poor: 500,
  },
};

/**
 * Get rating based on value and thresholds
 */
function getRating(
  value: number,
  thresholds: { good: number; poor: number },
): "good" | "needs-improvement" | "poor" {
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

/**
 * Report performance metric
 */
function reportMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === "production") {
    // Send to your analytics service
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        metric_id: metric.id,
      });
    }

    // Send to custom analytics endpoint
    fetch("/api/analytics/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
    }).catch((error) => {
      console.error("Failed to report performance metric:", error);
    });
  }
}

/**
 * Measure Core Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === "undefined") return;

  // Use web-vitals library if available
  import("web-vitals").then(({ onCLS, onFID, onLCP, onFCP, onTTFB, onINP }) => {
    onCLS((metric) => {
      reportMetric({
        name: "CLS",
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.CLS),
        delta: metric.delta,
        id: metric.id,
      });
    });

    onFID((metric) => {
      reportMetric({
        name: "FID",
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.FID),
        delta: metric.delta,
        id: metric.id,
      });
    });

    onLCP((metric) => {
      reportMetric({
        name: "LCP",
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.LCP),
        delta: metric.delta,
        id: metric.id,
      });
    });

    onFCP((metric) => {
      reportMetric({
        name: "FCP",
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.FCP),
        delta: metric.delta,
        id: metric.id,
      });
    });

    onTTFB((metric) => {
      reportMetric({
        name: "TTFB",
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.TTFB),
        delta: metric.delta,
        id: metric.id,
      });
    });

    onINP((metric) => {
      reportMetric({
        name: "INP",
        value: metric.value,
        rating: getRating(metric.value, THRESHOLDS.INP),
        delta: metric.delta,
        id: metric.id,
      });
    });
  });
}

/**
 * Measure custom performance metrics
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  /**
   * Start measuring a custom metric
   */
  start(name: string) {
    if (typeof performance === "undefined") return;
    this.marks.set(name, performance.now());
  }

  /**
   * End measuring and report metric
   */
  end(name: string) {
    if (typeof performance === "undefined") return;

    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    reportMetric({
      name: `custom_${name}`,
      value: duration,
      rating:
        duration < 1000
          ? "good"
          : duration < 3000
            ? "needs-improvement"
            : "poor",
    });

    return duration;
  }

  /**
   * Measure async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure page load performance
 */
export function measurePageLoad() {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    const perfData = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    if (perfData) {
      // DNS lookup time
      const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
      reportMetric({
        name: "DNS_Lookup",
        value: dnsTime,
        rating:
          dnsTime < 100 ? "good" : dnsTime < 300 ? "needs-improvement" : "poor",
      });

      // TCP connection time
      const tcpTime = perfData.connectEnd - perfData.connectStart;
      reportMetric({
        name: "TCP_Connection",
        value: tcpTime,
        rating:
          tcpTime < 100 ? "good" : tcpTime < 300 ? "needs-improvement" : "poor",
      });

      // Request time
      const requestTime = perfData.responseStart - perfData.requestStart;
      reportMetric({
        name: "Request_Time",
        value: requestTime,
        rating:
          requestTime < 200
            ? "good"
            : requestTime < 500
              ? "needs-improvement"
              : "poor",
      });

      // Response time
      const responseTime = perfData.responseEnd - perfData.responseStart;
      reportMetric({
        name: "Response_Time",
        value: responseTime,
        rating:
          responseTime < 200
            ? "good"
            : responseTime < 500
              ? "needs-improvement"
              : "poor",
      });

      // DOM processing time
      const domTime = perfData.domComplete - perfData.domInteractive;
      reportMetric({
        name: "DOM_Processing",
        value: domTime,
        rating:
          domTime < 500
            ? "good"
            : domTime < 1500
              ? "needs-improvement"
              : "poor",
      });

      // Total page load time
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;
      reportMetric({
        name: "Page_Load",
        value: loadTime,
        rating:
          loadTime < 2000
            ? "good"
            : loadTime < 4000
              ? "needs-improvement"
              : "poor",
      });
    }
  });
}

/**
 * Monitor resource loading
 */
export function monitorResources() {
  if (typeof window === "undefined") return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const resource = entry as PerformanceResourceTiming;

      // Report slow resources
      if (resource.duration > 1000) {
        reportMetric({
          name: "Slow_Resource",
          value: resource.duration,
          rating: "poor",
        });

        console.warn(
          `Slow resource: ${resource.name} (${resource.duration}ms)`,
        );
      }
    }
  });

  observer.observe({ entryTypes: ["resource"] });
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === "undefined") return;

  measureWebVitals();
  measurePageLoad();
  monitorResources();
}
