/**
 * Example of a secure API route using all security features
 * This demonstrates best practices for API route security
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createApiRoute,
  successResponse,
  errorResponse,
} from "@/lib/utils/api-route-wrapper";
import { RATE_LIMITS } from "@/lib/utils/rate-limit";
import { sanitizedString, sanitizedEmail } from "@/lib/validations/common";

// Define request body schema with validation
const createItemSchema = z.object({
  title: sanitizedString({
    min: 5,
    max: 100,
    message: "Title must be 5-100 characters",
  }),
  description: sanitizedString({
    min: 20,
    max: 500,
    message: "Description must be 20-500 characters",
  }),
  email: sanitizedEmail,
  price: z.number().positive().optional(),
});

/**
 * GET endpoint - List items with pagination
 * - Requires authentication
 * - Rate limited (200 req/min for authenticated users)
 * - Manual query parameter validation with type safety
 */
export const GET = createApiRoute(
  async ({ user, request }) => {
    // User is automatically populated because requireAuth: true

    // Manually parse and validate query parameters with type safety
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    // Parse with validation and defaults
    const page = pageParam ? Math.max(0, parseInt(pageParam, 10)) : 0;
    const limit = limitParam
      ? Math.min(100, Math.max(1, parseInt(limitParam, 10)))
      : 20;

    // Validate parsed values
    if (isNaN(page) || isNaN(limit)) {
      return errorResponse("Invalid pagination parameters", 400);
    }

    // Your business logic here
    const items = [
      { id: "1", title: "Item 1", userId: user.id },
      { id: "2", title: "Item 2", userId: user.id },
    ];

    return successResponse({
      items,
      pagination: {
        page,
        limit,
        total: items.length,
      },
    });
  },
  {
    requireAuth: true,
    rateLimit: RATE_LIMITS.AUTHENTICATED,
  },
);

/**
 * POST endpoint - Create new item
 * - Requires authentication
 * - Rate limited (100 req/min)
 * - Request body validation and sanitization
 * - XSS and SQL injection prevention
 */
export const POST = createApiRoute(
  async ({ user, body }) => {
    // Body is automatically validated and sanitized
    // All string fields are sanitized
    // XSS and SQL injection patterns are blocked

    const { title, description, email, price } = body!;

    // Your business logic here
    const newItem = {
      id: "new-id",
      title,
      description,
      email,
      price,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    return successResponse(newItem, 201);
  },
  {
    requireAuth: true,
    rateLimit: RATE_LIMITS.DEFAULT,
    bodySchema: createItemSchema,
  },
);

/**
 * DELETE endpoint - Delete item
 * - Requires authentication
 * - Rate limited
 * - Authorization check (user can only delete their own items)
 */
export const DELETE = createApiRoute(
  async ({ user, request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return errorResponse("Item ID is required", 400);
    }

    // Check if user owns the item
    // In real implementation, fetch from database
    const item = { id, userId: user.id };

    if (item.userId !== user.id) {
      return errorResponse(
        "You don't have permission to delete this item",
        403,
      );
    }

    // Delete logic here

    return successResponse({ message: "Item deleted successfully" });
  },
  {
    requireAuth: true,
    rateLimit: RATE_LIMITS.DEFAULT,
  },
);

/**
 * OPTIONS endpoint - CORS preflight
 * Automatically handled by createApiRoute wrapper
 */
