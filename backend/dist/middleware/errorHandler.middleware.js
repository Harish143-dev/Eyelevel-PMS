"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;
    // 1. Prisma Unique Constraint Error
    if (err.code === 'P2002') {
        // In production, return a generic message to prevent user enumeration via field names.
        // In development, expose the field for easier debugging.
        const message = process.env.NODE_ENV === 'development'
            ? `Duplicate value entered for ${err.meta?.target?.join(', ') || 'field'}`
            : 'Request could not be completed. A record with these details may already exist.';
        error = new AppError_1.AppError(message, 409);
        error.message = message;
    }
    // 2. Prisma Record Not Found Error
    if (err.code === 'P2025') {
        error = new AppError_1.AppError('The requested resource was not found', 404);
        error.message = 'The requested resource was not found';
    }
    // 4. Prisma Connection Errors (P1001, P1002, etc)
    if (err.code?.startsWith('P1')) {
        error = new AppError_1.AppError('The database server is currently unavailable. Please check your connection.', 503);
        error.message = 'The database server is currently unavailable. Please check your connection.';
    }
    // Check for raw connection strings in message even if code is missing
    if (!err.code && err.message?.includes('Can\'t reach database server')) {
        error = new AppError_1.AppError('The database server is currently unavailable. Please check your connection.', 503);
        error.message = 'The database server is currently unavailable. Please check your connection.';
    }
    // 3. Zod Validation Error
    if (err.name === 'ZodError') {
        error = new AppError_1.AppError('Validation failed', 400);
        error.message = 'Validation failed';
        error.details = err.errors;
    }
    // Determine standard properties
    const statusCode = error.statusCode || 500;
    const statusType = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Log error using structured logger
    if (statusCode === 500) {
        logger_1.logger.error('💥 CRITICAL ERROR:', err);
    }
    else {
        logger_1.logger.warn(`Operational Error [${statusCode}]: ${error.message}`, {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });
    }
    // Response payload
    res.status(statusCode).json({
        status: statusType,
        message: error.message || 'Internal Server Error',
        ...(error.details && { details: error.details }),
        // Send stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.middleware.js.map