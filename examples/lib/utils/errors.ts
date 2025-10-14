/**
 * @intent: Centralized error handling system
 * @llm-note: All errors should extend AppError for consistent handling
 * @architecture: Error hierarchy with proper HTTP status codes
 */

import { ValidationError as ZodValidationError } from "@/lib/utils/validation"
import { ForbiddenError as AccessForbiddenError } from "@/lib/services/access-control-service"

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR")
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} не найден`, 404, "NOT_FOUND")
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Требуется авторизация") {
    super(message, 401, "UNAUTHORIZED")
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Недостаточно прав") {
    super(message, 403, "FORBIDDEN")
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT")
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "BAD_REQUEST")
  }
}

/**
 * @intent: Centralized API error handler
 * @llm-note: Use this in all API routes catch blocks
 * @architecture: Converts all errors to proper HTTP responses
 */
export function handleApiError(error: unknown) {
  console.error("[v0] API Error:", error)

  // Handle Zod validation errors
  if (error instanceof ZodValidationError) {
    return Response.json(
      {
        error: error.message,
        code: "VALIDATION_ERROR",
        details: error.errors,
      },
      { status: 400 },
    )
  }

  // Handle access control errors
  if (error instanceof AccessForbiddenError) {
    return Response.json(
      {
        error: error.message,
        code: "FORBIDDEN",
      },
      { status: 403 },
    )
  }

  // Handle AppError hierarchy
  if (error instanceof AppError) {
    return Response.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode },
    )
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === "development" ? error.message : "Внутренняя ошибка сервера"

    return Response.json(
      {
        error: message,
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }

  // Unknown error type
  return Response.json(
    {
      error: "Внутренняя ошибка сервера",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  )
}
