/**
 * Tests for CSP Violation Reporting Endpoint
 * Tests task 14.1 requirements
 * 
 * Requirements Coverage:
 * - 10.5: Parse CSP violation reports from browser
 * - 10.5: Log violations to Sentry with appropriate tags
 * - 10.5: Return 204 No Content response
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Sentry - must be before imports
vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
}));

import { POST } from "./route";
import * as Sentry from "@sentry/nextjs";

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextRequest: class {
    public url: string;
    public json: any;

    constructor(url: string, body?: any) {
      this.url = url;
      this.json = vi.fn().mockResolvedValue(body);
    }
  },
  NextResponse: class {
    public body: any;
    public init: any;
    public status: number;
    
    constructor(body: any, init: any) {
      this.body = body;
      this.init = init;
      this.status = init?.status || 200;
    }
    
    static json(data: any, init?: any) {
      return new this(data, { status: init?.status || 200 });
    }
  },
}));

describe("CSP Violation Reporting Endpoint", () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    vi.mocked(Sentry.captureMessage).mockClear();
    // Reset environment
    process.env.NODE_ENV = "test";
  });

  it("should accept valid CSP violation reports and log to Sentry", async () => {
    // Arrange: Create a valid CSP violation report
    const cspReport = {
      "csp-report": {
        "document-uri": "https://example.com/page",
        "referrer": "",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "original-policy": "default-src 'self'; script-src 'self'",
        "disposition": "enforce",
        "blocked-uri": "https://malicious.com/script.js",
        "status-code": 200,
        "script-sample": "",
      },
    };

    // Mock request with CSP report
    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      cspReport
    );

    // Act: Send the CSP report to the endpoint
    const response = await POST(request);

    // Assert: Verify response is 204 No Content
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();

    // Assert: Verify Sentry was called with correct parameters
    expect(Sentry.captureMessage).toHaveBeenCalledWith("CSP Violation", {
      level: "warning",
      tags: {
        csp_directive: "script-src",
        blocked_uri: "https://malicious.com/script.js",
        source_file: "unknown",
        disposition: "enforce",
      },
      contexts: {
        csp: {
          document_uri: "https://example.com/page",
          referrer: "none",
          violated_directive: "script-src",
          effective_directive: "script-src",
          original_policy: "default-src 'self'; script-src 'self'",
          disposition: "enforce",
          blocked_uri: "https://malicious.com/script.js",
          source_file: "unknown",
          line_number: null,
          column_number: null,
          status_code: 200,
          script_sample: null,
        },
      },
    });
  });

  it("should include source file information when provided", async () => {
    // Arrange: CSP report with source file information
    const cspReport = {
      "csp-report": {
        "document-uri": "https://example.com/page",
        "violated-directive": "img-src",
        "effective-directive": "img-src",
        "original-policy": "default-src 'self'; img-src 'self'",
        "disposition": "enforce",
        "blocked-uri": "https://untrusted.com/image.jpg",
        "source-file": "https://example.com/page.js",
        "line-number": 42,
        "column-number": 15,
        "status-code": 200,
      },
    };

    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      cspReport
    );

    // Act
    const response = await POST(request);

    // Assert: Verify source file is included in tags and context
    expect(response.status).toBe(204);
    expect(Sentry.captureMessage).toHaveBeenCalledWith("CSP Violation", {
      level: "warning",
      tags: expect.objectContaining({
        source_file: "https://example.com/page.js",
      }),
      contexts: {
        csp: expect.objectContaining({
          source_file: "https://example.com/page.js",
          line_number: 42,
          column_number: 15,
        }),
      },
    });
  });

  it("should filter browser extension violations without logging", async () => {
    // Arrange: CSP report from browser extension
    const cspReport = {
      "csp-report": {
        "document-uri": "https://example.com/page",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "original-policy": "default-src 'self'",
        "disposition": "enforce",
        "blocked-uri": "chrome-extension://abc123/script.js",
        "status-code": 200,
      },
    };

    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      cspReport
    );

    // Act
    const response = await POST(request);

    // Assert: Returns 204 but doesn't log to Sentry
    expect(response.status).toBe(204);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("should filter data URI violations without logging", async () => {
    // Arrange: CSP report for data URI
    const cspReport = {
      "csp-report": {
        "document-uri": "https://example.com/page",
        "violated-directive": "img-src",
        "effective-directive": "img-src",
        "original-policy": "default-src 'self'",
        "disposition": "enforce",
        "blocked-uri": "data:image/png;base64,iVBORw0KG...",
        "status-code": 200,
      },
    };

    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      cspReport
    );

    // Act
    const response = await POST(request);

    // Assert: Returns 204 but doesn't log to Sentry
    expect(response.status).toBe(204);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("should filter blob URI violations without logging", async () => {
    // Arrange: CSP report for blob URI
    const cspReport = {
      "csp-report": {
        "document-uri": "https://example.com/page",
        "violated-directive": "img-src",
        "effective-directive": "img-src",
        "original-policy": "default-src 'self'",
        "disposition": "enforce",
        "blocked-uri": "blob:https://example.com/abc-123",
        "status-code": 200,
      },
    };

    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      cspReport
    );

    // Act
    const response = await POST(request);

    // Assert: Returns 204 but doesn't log to Sentry
    expect(response.status).toBe(204);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("should handle malformed reports gracefully", async () => {
    // Arrange: Malformed CSP report (missing required fields)
    const malformedReport = {
      invalid: "data",
    };

    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      malformedReport
    );

    // Act
    const response = await POST(request);

    // Assert: Should still return 204 to prevent browser retries
    expect(response.status).toBe(204);
  });

  it("should handle Sentry failures gracefully", async () => {
    // Arrange: Valid CSP report but Sentry throws error
    const cspReport = {
      "csp-report": {
        "document-uri": "https://example.com/page",
        "violated-directive": "script-src",
        "effective-directive": "script-src",
        "original-policy": "default-src 'self'",
        "disposition": "enforce",
        "blocked-uri": "https://malicious.com/script.js",
        "status-code": 200,
      },
    };

    // Make Sentry throw an error
    vi.mocked(Sentry.captureMessage).mockImplementationOnce(() => {
      throw new Error("Sentry unavailable");
    });

    const { NextRequest } = await import("next/server");
    const request = new (NextRequest as any)(
      "https://example.com/api/csp-report",
      cspReport
    );

    // Act
    const response = await POST(request);

    // Assert: Should still return 204 even if Sentry fails
    expect(response.status).toBe(204);
  });

  it("should tag violations with correct directive types", async () => {
    // Test different CSP directive violations
    const directives = [
      "script-src",
      "style-src",
      "img-src",
      "connect-src",
      "font-src",
      "object-src",
      "frame-src",
    ];

    for (const directive of directives) {
      vi.clearAllMocks();

      const cspReport = {
        "csp-report": {
          "document-uri": "https://example.com/page",
          "violated-directive": directive,
          "effective-directive": directive,
          "original-policy": `default-src 'self'; ${directive} 'self'`,
          "disposition": "enforce",
          "blocked-uri": "https://untrusted.com/resource",
          "status-code": 200,
        },
      };

      const { NextRequest } = await import("next/server");
      const request = new (NextRequest as any)(
        "https://example.com/api/csp-report",
        cspReport
      );

      // Act
      await POST(request);

      // Assert: Verify correct directive is tagged
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        "CSP Violation",
        expect.objectContaining({
          tags: expect.objectContaining({
            csp_directive: directive,
          }),
        })
      );
    }
  });
});
