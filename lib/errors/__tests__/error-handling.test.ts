import { describe, it, expect } from "vitest";
import {
  AppError,
  APIError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PaymentError,
  NetworkError,
  DatabaseError,
  FileUploadError,
  isAppError,
  getUserFriendlyMessage,
  getErrorStatusCode,
} from "../custom-errors";

describe("Custom Error Classes", () => {
  it("should create AppError with correct properties", () => {
    const error = new AppError("Test error", 400);
    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe("AppError");
  });

  it("should create APIError with correct status code", () => {
    const error = new APIError("API failed", 500);
    expect(error.message).toBe("API failed");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("APIError");
  });

  it("should create AuthenticationError with 401 status", () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Authentication failed");
  });

  it("should create AuthorizationError with 403 status", () => {
    const error = new AuthorizationError();
    expect(error.statusCode).toBe(403);
  });

  it("should create NotFoundError with 404 status", () => {
    const error = new NotFoundError("User");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("User not found");
  });

  it("should create ValidationError with field errors", () => {
    const errors = {
      email: ["Invalid email format"],
      password: ["Too short"],
    };
    const error = new ValidationError("Validation failed", errors);
    expect(error.statusCode).toBe(400);
    expect(error.errors).toEqual(errors);
  });

  it("should create RateLimitError with 429 status", () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
  });

  it("should create PaymentError with 402 status", () => {
    const error = new PaymentError();
    expect(error.statusCode).toBe(402);
  });

  it("should create NetworkError with 0 status", () => {
    const error = new NetworkError();
    expect(error.statusCode).toBe(0);
  });

  it("should create DatabaseError with 500 status", () => {
    const error = new DatabaseError();
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });

  it("should create FileUploadError with 400 status", () => {
    const error = new FileUploadError();
    expect(error.statusCode).toBe(400);
  });

  it("should identify AppError instances", () => {
    const appError = new AppError("Test");
    const regularError = new Error("Test");

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(regularError)).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  it("should get user-friendly message from AppError", () => {
    const error = new APIError("API failed");
    expect(getUserFriendlyMessage(error)).toBe("API failed");
  });

  it("should get user-friendly message from regular Error", () => {
    const error = new Error("Regular error");
    const message = getUserFriendlyMessage(error);

    // In production, should return generic message
    // In development, should return actual message
    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });

  it("should get error status code", () => {
    const appError = new APIError("Test", 404);
    const regularError = new Error("Test");

    expect(getErrorStatusCode(appError)).toBe(404);
    expect(getErrorStatusCode(regularError)).toBe(500);
  });
});
