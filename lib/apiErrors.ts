/**
 * Standardized API Error Handling for DogPlanner
 *
 * Usage:
 * ```typescript
 * import { ApiError, errorResponse, validateAuth } from '@/lib/apiErrors';
 *
 * // Throw errors
 * throw new ApiError(401, 'Unauthorized', 'No valid session found');
 *
 * // Return error responses
 * return errorResponse(error);
 *
 * // Validate authentication
 * const { user, orgId } = await validateAuth();
 * ```
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// =====================================================
// API ERROR CLASS
// =====================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: string,
    public errorCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// =====================================================
// STANDARD ERROR RESPONSE
// =====================================================

export function errorResponse(error: unknown): NextResponse {
  console.error("[API Error]", error);

  // Handle ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
        code: error.errorCode,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
        code: "[ERR-5000]",
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: "Unknown Error",
      details: "An unexpected error occurred",
      code: "[ERR-5001]",
    },
    { status: 500 }
  );
}

// =====================================================
// AUTHENTICATION VALIDATION
// =====================================================

export async function validateAuth(): Promise<{
  user: { id: string; email?: string };
  orgId: string;
}> {
  const supabase = await createClient();

  // Check session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new ApiError(
      401,
      "Unauthorized",
      "No valid authentication token found",
      "[ERR-4001]"
    );
  }

  // Get user profile with org_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      403,
      "Forbidden",
      "User profile not found",
      "[ERR-4002]"
    );
  }

  if (!profile.org_id) {
    throw new ApiError(
      403,
      "Forbidden",
      "No organization assigned to user",
      "[ERR-4003]"
    );
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
    },
    orgId: profile.org_id,
  };
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new ApiError(
      400,
      "Validation Error",
      `Missing required fields: ${missing.join(", ")}`,
      "[ERR-4004]"
    );
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(
      400,
      "Validation Error",
      "Invalid email format",
      "[ERR-4005]"
    );
  }
}

export function validateUUID(uuid: string, fieldName: string = "ID"): void {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ApiError(
      400,
      "Validation Error",
      `Invalid ${fieldName} format`,
      "[ERR-4006]"
    );
  }
}

// =====================================================
// COMMON ERROR FACTORIES
// =====================================================

export const CommonErrors = {
  unauthorized: () =>
    new ApiError(401, "Unauthorized", "Authentication required", "[ERR-4001]"),

  forbidden: (details?: string) =>
    new ApiError(403, "Forbidden", details || "Access denied", "[ERR-4002]"),

  notFound: (resource: string = "Resource") =>
    new ApiError(404, "Not Found", `${resource} not found`, "[ERR-4007]"),

  badRequest: (details: string) =>
    new ApiError(400, "Bad Request", details, "[ERR-4008]"),

  databaseError: (details?: string) =>
    new ApiError(
      500,
      "Database Error",
      details || "A database error occurred",
      "[ERR-1001]"
    ),

  rateLimit: () =>
    new ApiError(
      429,
      "Rate Limit Exceeded",
      "Too many requests. Please try again later.",
      "[ERR-4009]"
    ),
};

// =====================================================
// SUCCESS RESPONSE HELPERS
// =====================================================

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function createdResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message: message || "Resource created successfully",
      data,
    },
    { status: 201 }
  );
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
