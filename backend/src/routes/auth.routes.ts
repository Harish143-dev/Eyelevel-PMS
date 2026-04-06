import { Router } from 'express';
import { register, login, logout, refresh, forgotPassword, resetPassword, getMe } from '../controllers/auth.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';

import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// /me should be high priority for session restored on load, apply limiter
router.get('/me', authLimiter, verifyJWT, getMe);

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', verifyJWT, logout);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);


export default router;
