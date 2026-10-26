import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  generateCsrfToken,
  validateCsrfToken,
  csrfProtection,
  addCsrfTokenToResponse,
} from "../csrf-middleware";

describe("CSRF Middleware", () => {
  describe("generateCsrfToken", () => {
    it("should generate a token of correct length", () => {
      const token = generateCsrfToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });

    it("should generate unique tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate tokens with only hex characters", () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("validateCsrfToken", () => {
    it("should return true for GET requests", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });
      expect(validateCsrfToken(request)).toBe(true);
    });

    it("should return true for HEAD requests", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "HEAD",
      });
      expect(validateCsrfToken(request)).toBe(true);
    });

    it("should return true for OPTIONS requests", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
      });
      expect(validateCsrfToken(request)).toBe(true);
    });

    it("should return false for POST without CSRF token", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });
      expect(validateCsrfToken(request)).toBe(false);
    });

    it("should return false when header token is missing", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });
      request.cookies.set("csrf-token", "test-token");
      expect(validateCsrfToken(request)).toBe(false);
    });

    it("should return false when cookie token is missing", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": "test-token",
        },
      });
      expect(validateCsrfToken(request)).toBe(false);
    });

    it("should return false when tokens do not match", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": "token1",
        },
      });
      request.cookies.set("csrf-token", "token2");
      expect(validateCsrfToken(request)).toBe(false);
    });

    it("should return true when tokens match", () => {
      const token = "matching-token";
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
        },
      });
      request.cookies.set("csrf-token", token);
      expect(validateCsrfToken(request)).toBe(true);
    });

    it("should be case-sensitive when comparing tokens", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": "Token",
        },
      });
      request.cookies.set("csrf-token", "token");
      expect(validateCsrfToken(request)).toBe(false);
    });

    it("should prevent timing attacks with constant-time comparison", () => {
      const token1 = "a".repeat(64);
      const token2 = "b".repeat(64);

      const request1 = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": token1,
        },
      });
      request1.cookies.set("csrf-token", token2);

      const start1 = performance.now();
      validateCsrfToken(request1);
      const time1 = performance.now() - start1;

      const token3 = "a".repeat(63) + "b";
      const request2 = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": token3,
        },
      });
      request2.cookies.set("csrf-token", token2);

      const start2 = performance.now();
      validateCsrfToken(request2);
      const time2 = performance.now() - start2;

      // Timing should be similar (within 200% variance)
      // This is a basic check - timing attacks are complex and test execution is variable
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(3); // More lenient for test environment
    });
  });

  describe("addCsrfTokenToResponse", () => {
    it("should add CSRF token to response cookie", () => {
      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const cookie = updatedResponse.cookies.get("csrf-token");
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBeDefined();
      expect(cookie?.value.length).toBe(64);
    });

    it("should add CSRF token to response header", () => {
      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const headerToken = updatedResponse.headers.get("x-csrf-token");
      expect(headerToken).toBeDefined();
      expect(headerToken?.length).toBe(64);
    });

    it("should set cookie with httpOnly flag", () => {
      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const cookie = updatedResponse.cookies.get("csrf-token");
      expect(cookie?.httpOnly).toBe(true);
    });

    it("should set cookie with sameSite strict", () => {
      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const cookie = updatedResponse.cookies.get("csrf-token");
      expect(cookie?.sameSite).toBe("strict");
    });

    it("should set cookie with 24 hour expiry", () => {
      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const cookie = updatedResponse.cookies.get("csrf-token");
      expect(cookie?.maxAge).toBe(60 * 60 * 24);
    });

    it("should set secure flag in production", () => {
      const originalEnv = process.env.NODE_ENV;
      vi.stubEnv("NODE_ENV", "production");

      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const cookie = updatedResponse.cookies.get("csrf-token");
      expect(cookie?.secure).toBe(true);

      vi.unstubAllEnvs();
      if (originalEnv) vi.stubEnv("NODE_ENV", originalEnv);
    });

    it("should not set secure flag in development", () => {
      const originalEnv = process.env.NODE_ENV;
      vi.stubEnv("NODE_ENV", "development");

      const response = new NextResponse();
      const updatedResponse = addCsrfTokenToResponse(response);

      const cookie = updatedResponse.cookies.get("csrf-token");
      expect(cookie?.secure).toBe(false);

      vi.unstubAllEnvs();
      if (originalEnv) vi.stubEnv("NODE_ENV", originalEnv);
    });
  });

  describe("csrfProtection", () => {
    it("should return null for GET requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });
      const result = await csrfProtection(request);
      expect(result).toBeNull();
    });

    it("should return null for HEAD requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "HEAD",
      });
      const result = await csrfProtection(request);
      expect(result).toBeNull();
    });

    it("should return null for OPTIONS requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
      });
      const result = await csrfProtection(request);
      expect(result).toBeNull();
    });

    it("should return error response for POST without CSRF token", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });
      const result = await csrfProtection(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);

      const json = await result?.json();
      expect(json.error).toBe("CSRF validation failed");
    });

    it("should return error response for PUT without CSRF token", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "PUT",
      });
      const result = await csrfProtection(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
    });

    it("should return error response for PATCH without CSRF token", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "PATCH",
      });
      const result = await csrfProtection(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
    });

    it("should return error response for DELETE without CSRF token", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "DELETE",
      });
      const result = await csrfProtection(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
    });

    it("should return null when CSRF token is valid", async () => {
      const token = "valid-token";
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
        },
      });
      request.cookies.set("csrf-token", token);

      const result = await csrfProtection(request);
      expect(result).toBeNull();
    });

    it("should return error with descriptive message", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });
      const result = await csrfProtection(request);

      const json = await result?.json();
      expect(json.message).toBe("Invalid or missing CSRF token");
    });
  });

  describe("CSRF Protection Integration", () => {
    it("should protect against CSRF attacks", async () => {
      // Simulate attacker trying to make a request without valid CSRF token
      const attackRequest = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": "attacker-token",
        },
      });
      attackRequest.cookies.set("csrf-token", "victim-token");

      const result = await csrfProtection(attackRequest);
      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
    });

    it("should allow legitimate requests with matching tokens", async () => {
      const token = generateCsrfToken();
      const legitimateRequest = new NextRequest(
        "http://localhost:3000/api/test",
        {
          method: "POST",
          headers: {
            "x-csrf-token": token,
          },
        },
      );
      legitimateRequest.cookies.set("csrf-token", token);

      const result = await csrfProtection(legitimateRequest);
      expect(result).toBeNull();
    });
  });
});
