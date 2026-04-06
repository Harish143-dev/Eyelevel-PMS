"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * Custom Error class for operational errors.
 * Used to distinguish unhandled bugs from predictable operational errors
 * (e.g., validation failed, record not found).
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Identifies this as an expected error type
        // Capture stack trace excluding the constructor call
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map