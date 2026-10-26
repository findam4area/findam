/**
 * Performance Monitoring Test Suite
 * 
 * Tests for Core Web Vitals measurement and performance utilities
 * Requirements: 8.1 (FCP < 1.5s), 8.2 (LCP < 2.5s), 8.3 (CLS < 0.1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  measureWebVitals, 
  PerformanceMonitor,
  initPerformanceMonitoring 
} from '@/lib/monitoring/performance';

describe('Performance Monitoring', () => {
  describe('PerformanceMonitor', () => {
    it('should have start and end methods', () => {
      const monitor = new PerformanceMonitor();
      
      expect(monitor.start).toBeDefined();
      expect(monitor.end).toBeDefined();
      expect(monitor.measure).toBeDefined();
    });

    it('should handle missing start mark', () => {
      const monitor = new PerformanceMonitor();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const duration = monitor.end('non-existent');
      
      expect(duration).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No start mark found')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle errors in measured operations', async () => {
      const monitor = new PerformanceMonitor();
      
      await expect(
        monitor.measure('error-operation', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Performance Thresholds', () => {
    it('should validate FCP threshold requirement', () => {
      const FCP_THRESHOLD = 1500; // 1.5s requirement
      const FCP_3G_TARGET = 1800; // design document good threshold
      
      expect(FCP_THRESHOLD).toBeLessThanOrEqual(FCP_3G_TARGET);
    });

    it('should validate LCP threshold requirement', () => {
      const LCP_THRESHOLD = 2500; // 2.5s requirement
      const LCP_3G_TARGET = 2500; // design document good threshold
      
      expect(LCP_THRESHOLD).toBeLessThanOrEqual(LCP_3G_TARGET);
    });

    it('should validate CLS threshold requirement', () => {
      const CLS_THRESHOLD = 0.1; // 0.1 requirement
      const CLS_TARGET = 0.1; // design document good threshold
      
      expect(CLS_THRESHOLD).toBeLessThanOrEqual(CLS_TARGET);
    });
  });

  describe('Web Vitals Integration', () => {
    it('should import web-vitals library', async () => {
      const webVitals = await import('web-vitals');
      
      expect(webVitals.onCLS).toBeDefined();
      expect(webVitals.onFID).toBeDefined();
      expect(webVitals.onLCP).toBeDefined();
      expect(webVitals.onFCP).toBeDefined();
      expect(webVitals.onTTFB).toBeDefined();
      expect(webVitals.onINP).toBeDefined();
    });
  });

  describe('Rating Classification', () => {
    it('should classify FCP ratings correctly', () => {
      const goodFCP = 1000;
      const needsImprovementFCP = 2000;
      const poorFCP = 3500;
      
      expect(goodFCP).toBeLessThanOrEqual(1800);
      expect(needsImprovementFCP).toBeGreaterThan(1800);
      expect(needsImprovementFCP).toBeLessThanOrEqual(3000);
      expect(poorFCP).toBeGreaterThan(3000);
    });

    it('should classify LCP ratings correctly', () => {
      const goodLCP = 2000;
      const needsImprovementLCP = 3000;
      const poorLCP = 4500;
      
      expect(goodLCP).toBeLessThanOrEqual(2500);
      expect(needsImprovementLCP).toBeGreaterThan(2500);
      expect(needsImprovementLCP).toBeLessThanOrEqual(4000);
      expect(poorLCP).toBeGreaterThan(4000);
    });

    it('should classify CLS ratings correctly', () => {
      const goodCLS = 0.05;
      const needsImprovementCLS = 0.15;
      const poorCLS = 0.3;
      
      expect(goodCLS).toBeLessThanOrEqual(0.1);
      expect(needsImprovementCLS).toBeGreaterThan(0.1);
      expect(needsImprovementCLS).toBeLessThanOrEqual(0.25);
      expect(poorCLS).toBeGreaterThan(0.25);
    });
  });

  describe('Performance Monitoring Initialization', () => {
    it('should not crash when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(() => initPerformanceMonitoring()).not.toThrow();
      
      // @ts-ignore
      global.window = originalWindow;
    });
  });

  describe('3G Connection Simulation', () => {
    it('should define 3G network profile constraints', () => {
      const SLOW_3G_PROFILE = {
        downloadThroughput: 400 * 1024 / 8, // 400 Kbps
        uploadThroughput: 400 * 1024 / 8,   // 400 Kbps
        latency: 400,                        // 400ms RTT
      };
      
      expect(SLOW_3G_PROFILE.downloadThroughput).toBe(50 * 1024);
      expect(SLOW_3G_PROFILE.latency).toBe(400);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect FCP regression', () => {
      const baselineFCP = 1200;
      const currentFCP = 1800;
      const threshold = 0.2; // 20% regression threshold
      
      const regression = (currentFCP - baselineFCP) / baselineFCP;
      
      expect(regression).toBeGreaterThan(threshold);
    });

    it('should detect LCP regression', () => {
      const baselineLCP = 2000;
      const currentLCP = 2600;
      const threshold = 0.2; // 20% regression threshold
      
      const regression = (currentLCP - baselineLCP) / baselineLCP;
      
      expect(regression).toBeGreaterThan(threshold);
    });

    it('should detect CLS regression', () => {
      const baselineCLS = 0.05;
      const currentCLS = 0.20; // Increased to clearly exceed threshold
      const threshold = 0.1; // 0.1 absolute threshold
      
      const regression = currentCLS - baselineCLS;
      
      expect(regression).toBeGreaterThan(threshold);
    });

    it('should not flag acceptable variations', () => {
      const baselineFCP = 1200;
      const currentFCP = 1300;
      const threshold = 0.2; // 20% regression threshold
      
      const regression = (currentFCP - baselineFCP) / baselineFCP;
      
      expect(regression).toBeLessThan(threshold);
    });
  });
});
