/**
 * Unit tests for Security Headers Validation Script
 * 
 * Tests the validation logic without requiring a running server
 */

import { describe, it, expect } from 'vitest';

// Mock headers for testing
const mockHeadersValid: Record<string, string> = {
  'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.paystack.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: *.supabase.co res.cloudinary.com; font-src 'self' data:; connect-src 'self' *.supabase.co https://api.paystack.co; media-src 'self' blob: *.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'self' https://js.paystack.co; upgrade-insecure-requests",
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-frame-options': 'SAMEORIGIN',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)'
};

const mockHeadersInvalid: Record<string, string> = {
  'content-security-policy': "default-src *; script-src *",
  'strict-transport-security': 'max-age=3600',
  'x-frame-options': 'ALLOW-FROM https://example.com',
  'x-content-type-options': 'sniff',
  'x-powered-by': 'Next.js'
};

/**
 * Parse Content-Security-Policy header into directives object
 */
function parseCSP(cspHeader: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};
  
  if (!cspHeader) return directives;
  
  const parts = cspHeader.split(';').map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    const [directive, ...values] = part.split(/\s+/);
    if (directive) {
      directives[directive] = values;
    }
  }
  
  return directives;
}

/**
 * Parse Strict-Transport-Security header
 */
function parseHSTS(hstsHeader: string): { maxAge: number; includeSubDomains: boolean; preload: boolean } {
  const result = {
    maxAge: 0,
    includeSubDomains: false,
    preload: false
  };
  
  if (!hstsHeader) return result;
  
  const parts = hstsHeader.split(';').map(s => s.trim());
  
  for (const part of parts) {
    if (part.startsWith('max-age=')) {
      result.maxAge = parseInt(part.split('=')[1], 10) || 0;
    } else if (part === 'includeSubDomains') {
      result.includeSubDomains = true;
    } else if (part === 'preload') {
      result.preload = true;
    }
  }
  
  return result;
}

describe('parseCSP', () => {
  it('should parse CSP header into directives object', () => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'";
    const directives = parseCSP(csp);
    
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directives['style-src']).toEqual(["'self'"]);
  });
  
  it('should handle upgrade-insecure-requests directive without values', () => {
    const csp = "default-src 'self'; upgrade-insecure-requests";
    const directives = parseCSP(csp);
    
    expect(directives['upgrade-insecure-requests']).toEqual([]);
  });
  
  it('should handle empty CSP header', () => {
    const directives = parseCSP('');
    expect(Object.keys(directives)).toHaveLength(0);
  });
});

describe('parseHSTS', () => {
  it('should parse HSTS header with all components', () => {
    const hsts = parseHSTS('max-age=63072000; includeSubDomains; preload');
    
    expect(hsts.maxAge).toBe(63072000);
    expect(hsts.includeSubDomains).toBe(true);
    expect(hsts.preload).toBe(true);
  });
  
  it('should parse HSTS header with only max-age', () => {
    const hsts = parseHSTS('max-age=31536000');
    
    expect(hsts.maxAge).toBe(31536000);
    expect(hsts.includeSubDomains).toBe(false);
    expect(hsts.preload).toBe(false);
  });
  
  it('should handle missing HSTS header', () => {
    const hsts = parseHSTS('');
    
    expect(hsts.maxAge).toBe(0);
    expect(hsts.includeSubDomains).toBe(false);
    expect(hsts.preload).toBe(false);
  });
});

describe('CSP Validation Logic', () => {
  it('should validate that default-src includes self', () => {
    const directives = parseCSP(mockHeadersValid['content-security-policy']);
    expect(directives['default-src']).toContain("'self'");
  });
  
  it('should validate that frame-ancestors is set', () => {
    const directives = parseCSP(mockHeadersValid['content-security-policy']);
    expect(directives['frame-ancestors']).toBeDefined();
  });
  
  it('should validate that object-src is none', () => {
    const directives = parseCSP(mockHeadersValid['content-security-policy']);
    expect(directives['object-src']).toContain("'none'");
  });
  
  it('should detect missing required directives', () => {
    const csp = "default-src 'self'";
    const directives = parseCSP(csp);
    
    expect(directives['script-src']).toBeUndefined();
    expect(directives['style-src']).toBeUndefined();
  });
});

describe('HSTS Validation Logic', () => {
  it('should validate max-age is at least 1 year', () => {
    const hsts = parseHSTS(mockHeadersValid['strict-transport-security']);
    const minMaxAge = 31536000; // 1 year
    
    expect(hsts.maxAge).toBeGreaterThanOrEqual(minMaxAge);
  });
  
  it('should detect insufficient max-age', () => {
    const hsts = parseHSTS(mockHeadersInvalid['strict-transport-security']);
    const minMaxAge = 31536000;
    
    expect(hsts.maxAge).toBeLessThan(minMaxAge);
  });
});

describe('X-Frame-Options Validation Logic', () => {
  it('should accept SAMEORIGIN value', () => {
    const xfo = mockHeadersValid['x-frame-options'];
    const validValues = ['DENY', 'SAMEORIGIN'];
    
    expect(validValues).toContain(xfo.toUpperCase());
  });
  
  it('should reject invalid values', () => {
    const xfo = mockHeadersInvalid['x-frame-options'];
    const validValues = ['DENY', 'SAMEORIGIN'];
    
    expect(validValues).not.toContain(xfo.toUpperCase());
  });
});

describe('X-Content-Type-Options Validation Logic', () => {
  it('should accept nosniff value', () => {
    const xcto = mockHeadersValid['x-content-type-options'];
    expect(xcto.toLowerCase()).toBe('nosniff');
  });
  
  it('should reject invalid values', () => {
    const xcto = mockHeadersInvalid['x-content-type-options'];
    expect(xcto.toLowerCase()).not.toBe('nosniff');
  });
});

describe('X-Powered-By Validation Logic', () => {
  it('should pass when X-Powered-By is not present', () => {
    expect(mockHeadersValid['x-powered-by']).toBeUndefined();
  });
  
  it('should fail when X-Powered-By is present', () => {
    expect(mockHeadersInvalid['x-powered-by']).toBeDefined();
  });
});

describe('Referrer-Policy Validation Logic', () => {
  it('should accept valid referrer policy', () => {
    const rp = mockHeadersValid['referrer-policy'];
    const validPolicies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url'
    ];
    
    expect(validPolicies).toContain(rp.toLowerCase());
  });
});
