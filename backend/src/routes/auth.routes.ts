import { Router } from 'express';
import { register, login, logout, refresh, forgotPassword, resetPassword, getMe } from '../controllers/auth.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyJWT, logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', verifyJWT, getMe);

export default router;
