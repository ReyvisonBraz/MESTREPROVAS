export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      title: this.code,
      status: this.statusCode,
      detail: this.message,
    };
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500);
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR', 500);
  }
}

export class InvalidResponseError extends AppError {
  constructor(message: string) {
    super(message, 'INVALID_RESPONSE', 500);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(public readonly errors: FieldError[]) {
    super('Validation failed', 'VALIDATION_ERROR', 422);
  }

  toJSON() {
    return {
      title: this.code,
      status: this.statusCode,
      detail: this.message,
      errors: this.errors,
    };
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please wait a moment.') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(message, 'INTERNAL_ERROR', 500, false);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
