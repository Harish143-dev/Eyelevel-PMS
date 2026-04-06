/**
 * Strict rate limiter for authentication endpoints (login/register/refresh).
 * 100 attempts per 15-minute window for GET requests (session checks),
 * 20 attempts per 15-minute window for mutations.
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Global mutation rate limiter for POST / PUT / DELETE operations.
 * 60 write requests per minute per IP.
 * GET requests are excluded so reads remain unlimited.
 */
export declare const mutationLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Sensitive operation rate limiter for destructive actions
 * (user deletion, project deletion, role changes).
 * 10 requests per 15-minute window.
 */
export declare const sensitiveLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.middleware.d.ts.map