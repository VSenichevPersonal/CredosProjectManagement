/**
 * Custom Error Classes
 * Provides structured error handling with user-friendly messages
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage || this.message,
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      'Пожалуйста, проверьте введённые данные'
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(
    resource: string,
    id?: string
  ) {
    const message = id
      ? `${resource} с ID "${id}" не найден`
      : `${resource} не найден`;
    
    super(
      message,
      'NOT_FOUND',
      404,
      message
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Требуется авторизация') {
    super(
      message,
      'UNAUTHORIZED',
      401,
      'Пожалуйста, войдите в систему'
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Доступ запрещён') {
    super(
      message,
      'FORBIDDEN',
      403,
      'У вас нет прав для выполнения этого действия'
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, resource: string) {
    super(
      message,
      'CONFLICT',
      409,
      `${resource} уже существует или конфликтует с существующими данными`
    );
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(
      message,
      'DATABASE_ERROR',
      500,
      'Произошла ошибка при работе с базой данных. Пожалуйста, попробуйте позже.'
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    public originalError?: any
  ) {
    super(
      `${service}: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      `Сервис ${service} временно недоступен. Пожалуйста, попробуйте позже.`
    );
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific database errors
    if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
      return new ConflictError(error.message, 'Запись');
    }
    
    if (error.message.includes('foreign key') || error.message.includes('violates')) {
      return new ValidationError('Невозможно выполнить операцию: есть связанные записи');
    }

    // Generic error
    return new AppError(
      error.message,
      'INTERNAL_ERROR',
      500,
      'Произошла внутренняя ошибка. Пожалуйста, попробуйте позже.'
    );
  }

  // Unknown error
  return new AppError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    'Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.'
  );
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  const appError = handleError(error);
  return appError.userMessage || appError.message;
}

