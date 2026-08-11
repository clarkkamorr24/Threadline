export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  STORAGE: 'STORAGE_ERROR',
  PAYMENT: 'PAYMENT_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface FieldIssue {
  readonly path: string;
  readonly message: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly issues: readonly FieldIssue[];

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    issues: readonly FieldIssue[] = [],
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.issues = issues;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', issues: readonly FieldIssue[] = []) {
    super(ERROR_CODES.VALIDATION, message, 422, issues);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'You must be signed in to do that.') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do that.') {
    super(ERROR_CODES.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(ERROR_CODES.NOT_FOUND, `${resource} was not found.`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'That resource already exists.') {
    super(ERROR_CODES.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super(
      ERROR_CODES.INSUFFICIENT_STOCK,
      available > 0
        ? `Only ${available} left of "${productName}".`
        : `"${productName}" is out of stock.`,
      409,
    );
    this.name = 'InsufficientStockError';
  }
}

export class StorageError extends AppError {
  constructor(message = 'The file could not be stored.') {
    super(ERROR_CODES.STORAGE, message, 502);
    this.name = 'StorageError';
  }
}

export class PaymentError extends AppError {
  constructor(message = 'The payment could not be processed.') {
    super(ERROR_CODES.PAYMENT, message, 502);
    this.name = 'PaymentError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toPublicError(error: unknown, context: string): AppError {
  if (isAppError(error)) {
    return error;
  }

  console.error(`[${context}] Unexpected failure:`, error);
  return new AppError(ERROR_CODES.INTERNAL, 'Something went wrong. Please try again.', 500);
}
