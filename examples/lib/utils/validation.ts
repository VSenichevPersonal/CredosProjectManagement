/**
 * @intent: Centralized validation utilities
 * @llm-note: Helper functions for consistent validation across the app
 */

import type { z } from "zod"

/**
 * @intent: Validate data against schema and return typed result
 * @llm-note: Use this in API routes for consistent error handling
 */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.flatten())
  }

  return result.data
}

/**
 * @intent: Custom validation error
 * @llm-note: Thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodFormattedError<any>,
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

/**
 * @intent: Format validation errors for API response
 * @llm-note: Converts Zod errors to user-friendly format
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join(".")
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(err.message)
  })

  return formatted
}
