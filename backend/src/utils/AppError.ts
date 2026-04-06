/**
 * Custom Error class for operational errors.
 * Used to distinguish unhandled bugs from predictable operational errors
 * (e.g., validation failed, record not found).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true; // Identifies this as an expected error type

    // Capture stack trace excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}
