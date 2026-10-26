import { describe, it, expect } from "vitest";

describe("Error Handling Imports", () => {
  it("should import custom error classes", async () => {
    const routeModule = await import("../custom-errors");

    expect(routeModule.AppError).toBeDefined();
    expect(routeModule.APIError).toBeDefined();
    expect(routeModule.AuthenticationError).toBeDefined();
    expect(routeModule.AuthorizationError).toBeDefined();
    expect(routeModule.NotFoundError).toBeDefined();
    expect(routeModule.ValidationError).toBeDefined();
    expect(routeModule.RateLimitError).toBeDefined();
    expect(routeModule.PaymentError).toBeDefined();
    expect(routeModule.NetworkError).toBeDefined();
    expect(routeModule.DatabaseError).toBeDefined();
    expect(routeModule.FileUploadError).toBeDefined();
    expect(routeModule.isAppError).toBeDefined();
    expect(routeModule.getUserFriendlyMessage).toBeDefined();
    expect(routeModule.getErrorStatusCode).toBeDefined();
  });

  it("should import error tracker", async () => {
    const routeModule = await import("../error-tracker");

    expect(routeModule.initErrorTracker).toBeDefined();
    expect(routeModule.getErrorTracker).toBeDefined();
    expect(routeModule.trackError).toBeDefined();
    expect(routeModule.trackMessage).toBeDefined();
    expect(routeModule.setErrorTrackingUser).toBeDefined();
    expect(routeModule.addBreadcrumb).toBeDefined();
  });

  it("should import error handler", async () => {
    const routeModule = await import("../error-handler");

    expect(routeModule.handleError).toBeDefined();
    expect(routeModule.handleSuccess).toBeDefined();
    expect(routeModule.handleInfo).toBeDefined();
    expect(routeModule.handleWarning).toBeDefined();
    expect(routeModule.handleLoading).toBeDefined();
    expect(routeModule.dismissToast).toBeDefined();
    expect(routeModule.handleAsyncOperation).toBeDefined();
  });

  it("should import API error handler", async () => {
    const routeModule = await import("../api-error-handler");

    expect(routeModule.handleApiError).toBeDefined();
    expect(routeModule.withErrorHandling).toBeDefined();
    expect(routeModule.successResponse).toBeDefined();
    expect(routeModule.errorResponse).toBeDefined();
  });

  it("should import from index", async () => {
    const routeModule = await import("../index");

    // Custom errors
    expect(routeModule.AppError).toBeDefined();
    expect(routeModule.APIError).toBeDefined();

    // Error tracking
    expect(routeModule.initErrorTracker).toBeDefined();
    expect(routeModule.trackError).toBeDefined();

    // Error handling
    expect(routeModule.handleError).toBeDefined();
    expect(routeModule.handleSuccess).toBeDefined();
  });
});
