/**
 * @intent: Re-export errors for backward compatibility
 * @llm-note: Main error definitions are in lib/utils/errors.ts
 */

export {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  handleApiError,
} from "@/lib/utils/errors"
