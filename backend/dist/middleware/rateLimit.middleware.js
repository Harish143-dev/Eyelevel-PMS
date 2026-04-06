"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensitiveLimiter = exports.mutationLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Strict rate limiter for authentication endpoints (login/register/refresh).
 * 100 attempts per 15-minute window for GET requests (session checks),
 * 20 attempts per 15-minute window for mutations.
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => req.method === 'GET' ? 100 : 20,
    message: { message: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Global mutation rate limiter for POST / PUT / DELETE operations.
 * 60 write requests per minute per IP.
 * GET requests are excluded so reads remain unlimited.
 */
exports.mutationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    message: { message: 'API rate limit exceeded. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET',
});
/**
 * Sensitive operation rate limiter for destructive actions
 * (user deletion, project deletion, role changes).
 * 10 requests per 15-minute window.
 */
exports.sensitiveLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Too many sensitive operations. Please wait and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimit.middleware.js.map