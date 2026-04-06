/**
 * Custom Error class for operational errors.
 * Used to distinguish unhandled bugs from predictable operational errors
 * (e.g., validation failed, record not found).
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number);
}
//# sourceMappingURL=AppError.d.ts.map