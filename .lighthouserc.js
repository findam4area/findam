/**
 * Lighthouse CI Configuration
 * 
 * Performance budgets aligned with requirements:
 * - FCP < 1500ms (Requirement 8.1)
 * - LCP < 2500ms (Requirement 8.2)
 * - CLS < 0.1 (Requirement 8.3)
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000',
        'http://localhost:3000/browse',
        'http://localhost:3000/search',
        // Browse categories page enhancement - Task 22.1
        'http://localhost:3000/categories/electronics',
        'http://localhost:3000/categories/fashion',
      ],
      // Number of runs per URL
      numberOfRuns: 3,
      // Settings
      settings: {
        // Simulate 3G connection for requirements 8.1 and 8.2
        throttling: {
          rttMs: 300,
          throughputKbps: 1600,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1600,
          uploadThroughputKbps: 750,
          cpuSlowdownMultiplier: 4,
        },
        // Only desktop for now (mobile can be added)
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance Score
        'categories:performance': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals - Requirement 8.1: FCP < 1.5s on 3G
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        
        // Core Web Vitals - Requirement 8.2: LCP < 2.5s on 3G
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        
        // Core Web Vitals - Requirement 8.3: CLS < 0.1
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Additional Performance Metrics
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'max-potential-fid': ['warn', { maxNumericValue: 130 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        
        // Accessibility - Requirement 15.1 (WCAG 2.1 AA)
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // SEO - Requirement 20
        'categories:seo': ['warn', { minScore: 0.9 }],
        
        // Resource Hints
        'uses-rel-preconnect': 'off',
        'uses-rel-preload': 'off',
        
        // Modern Image Formats
        'modern-image-formats': 'warn',
        'uses-optimized-images': 'warn',
        'offscreen-images': 'warn',
        
        // JavaScript
        'unused-javascript': 'off', // Too strict for real apps
        'bootup-time': ['warn', { maxNumericValue: 3000 }],
        
        // Network
        'server-response-time': ['warn', { maxNumericValue: 600 }],
        'redirects': 'error',
        
        // Caching
        'uses-long-cache-ttl': 'warn',
        
        // Critical Request Chains
        'critical-request-chains': 'warn',
        
        // Render Blocking Resources
        'render-blocking-resources': 'warn',
        
        // Font Display
        'font-display': 'warn',
        
        // Third Party
        'third-party-summary': 'off',
        
        // Diagnostics
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        'dom-size': ['warn', { maxNumericValue: 1500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // For CI/CD: use 'filesystem' or a server target
      // target: 'filesystem',
      // outputDir: './lighthouse-reports',
    },
  },
};
