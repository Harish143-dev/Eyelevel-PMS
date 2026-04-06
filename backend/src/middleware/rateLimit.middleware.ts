import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints (login/register/refresh).
 * 100 attempts per 15-minute window for GET requests (session checks),
 * 20 attempts per 15-minute window for mutations.
 */
export const authLimiter = rateLimit({
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
export const mutationLimiter = rateLimit({
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
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many sensitive operations. Please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
