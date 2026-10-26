/**
 * Unit tests for CSP Configuration Builder
 * 
 * Tests verify that the CSP builder function correctly handles:
 * - Environment-specific directives (development vs production)
 * - Third-party integration support (Paystack, Supabase)
 * - Security requirements (frame-ancestors, object-src, etc.)
 */

import { describe, it, expect } from 'vitest';
import { buildCSPDirectives, buildCSPForEnvironment, CSPConfig } from './csp-builder';

describe('buildCSPDirectives', () => {
  describe('default configuration', () => {
    it('should include default-src self', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("default-src 'self'");
    });

    it('should include script-src with self and unsafe-inline', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("'unsafe-inline'");
    });

    it('should include Paystack domain in script-src', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('https://js.paystack.co');
    });

    it('should include Supabase storage in img-src', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('*.supabase.co');
    });

    it('should include Cloudinary in img-src', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('res.cloudinary.com');
    });

    it('should include data URIs in img-src', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("img-src 'self' data: blob: https: *.supabase.co res.cloudinary.com");
    });

    it('should set object-src to none', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("object-src 'none'");
    });

    it('should set frame-ancestors to none', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should include upgrade-insecure-requests', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should include Paystack in frame-src', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("frame-src 'self' https://js.paystack.co");
    });

    it('should include Supabase and Paystack in connect-src', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('*.supabase.co');
      expect(csp).toContain('https://api.paystack.co');
    });

    it('should include report-uri directive', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('report-uri /api/csp-report');
    });

    it('should include report-to directive', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain('report-to csp-endpoint');
    });
  });

  describe('development environment', () => {
    it('should include unsafe-eval in development', () => {
      const csp = buildCSPDirectives({ environment: 'development' });
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should include localhost WebSocket in development', () => {
      const csp = buildCSPDirectives({ environment: 'development' });
      expect(csp).toContain('ws://localhost:*');
      expect(csp).toContain('http://localhost:*');
    });

    it('should place unsafe-eval after self in script-src', () => {
      const csp = buildCSPDirectives({ environment: 'development' });
      const scriptSrcMatch = csp.match(/script-src ([^;]+)/);
      expect(scriptSrcMatch).toBeTruthy();
      const scriptSrc = scriptSrcMatch![1];
      const selfIndex = scriptSrc.indexOf("'self'");
      const evalIndex = scriptSrc.indexOf("'unsafe-eval'");
      expect(selfIndex).toBeLessThan(evalIndex);
    });
  });

  describe('production environment', () => {
    it('should NOT include unsafe-eval in production', () => {
      const csp = buildCSPDirectives({ environment: 'production' });
      expect(csp).not.toContain("'unsafe-eval'");
    });

    it('should NOT include localhost connections in production', () => {
      const csp = buildCSPDirectives({ environment: 'production' });
      expect(csp).not.toContain('ws://localhost:*');
      expect(csp).not.toContain('http://localhost:*');
    });
  });

  describe('custom configuration', () => {
    it('should merge custom script-src with defaults', () => {
      const config: CSPConfig = {
        scriptSrc: ["'self'", 'https://custom-cdn.com'],
        environment: 'production'
      };
      const csp = buildCSPDirectives(config);
      expect(csp).toContain('https://custom-cdn.com');
    });

    it('should allow disabling upgrade-insecure-requests', () => {
      const config: CSPConfig = {
        upgradeInsecureRequests: false,
      };
      const csp = buildCSPDirectives(config);
      expect(csp).not.toContain('upgrade-insecure-requests');
    });

    it('should allow custom frame-ancestors', () => {
      const config: CSPConfig = {
        frameAncestors: ["'self'", 'https://trusted-embedder.com'],
      };
      const csp = buildCSPDirectives(config);
      expect(csp).toContain("frame-ancestors 'self' https://trusted-embedder.com");
    });

    it('should allow custom img-src', () => {
      const config: CSPConfig = {
        imgSrc: ["'self'", 'https://custom-image-host.com'],
      };
      const csp = buildCSPDirectives(config);
      expect(csp).toContain('https://custom-image-host.com');
    });

    it('should allow custom report-uri', () => {
      const config: CSPConfig = {
        reportUri: '/custom/csp-report',
      };
      const csp = buildCSPDirectives(config);
      expect(csp).toContain('report-uri /custom/csp-report');
    });

    it('should allow custom report-to', () => {
      const config: CSPConfig = {
        reportTo: 'custom-endpoint',
      };
      const csp = buildCSPDirectives(config);
      expect(csp).toContain('report-to custom-endpoint');
    });
  });

  describe('CSP directive format', () => {
    it('should separate directives with semicolons and spaces', () => {
      const csp = buildCSPDirectives();
      expect(csp).toMatch(/; /);
    });

    it('should not have trailing semicolon', () => {
      const csp = buildCSPDirectives();
      expect(csp).not.toMatch(/;\s*$/);
    });

    it('should include all required directives', () => {
      const csp = buildCSPDirectives();
      const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'font-src',
        'connect-src',
        'media-src',
        'object-src',
        'base-uri',
        'form-action',
        'frame-ancestors',
        'frame-src'
      ];
      
      requiredDirectives.forEach(directive => {
        expect(csp).toContain(directive);
      });
    });
  });

  describe('security requirements', () => {
    it('should prevent clickjacking with frame-ancestors none', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should block plugins with object-src none', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("object-src 'none'");
    });

    it('should restrict form submissions to self', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("form-action 'self'");
    });

    it('should restrict base URI to self', () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("base-uri 'self'");
    });
  });
});

describe('buildCSPForEnvironment', () => {
  it('should build CSP based on NODE_ENV', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Test development
    process.env.NODE_ENV = 'development';
    const devCSP = buildCSPForEnvironment();
    expect(devCSP).toContain("'unsafe-eval'");
    expect(devCSP).toContain('ws://localhost:*');
    
    // Test production
    process.env.NODE_ENV = 'production';
    const prodCSP = buildCSPForEnvironment();
    expect(prodCSP).not.toContain("'unsafe-eval'");
    expect(prodCSP).not.toContain('ws://localhost:*');
    
    // Restore original
    process.env.NODE_ENV = originalEnv;
  });

  it('should default to production if NODE_ENV is not development', () => {
    const originalEnv = process.env.NODE_ENV;
    
    process.env.NODE_ENV = 'test';
    const csp = buildCSPForEnvironment();
    expect(csp).not.toContain("'unsafe-eval'");
    
    process.env.NODE_ENV = originalEnv;
  });
});
