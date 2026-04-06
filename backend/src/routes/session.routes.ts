import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import {
  createSession,
  endSession,
  getActiveSessions,
  forceLogoutSession,
  getOnlineUsers,
} from '../controllers/session.controller';

const router = Router();

router.use(verifyJWT);

router.post('/login', createSession);
router.post('/logout', endSession);
router.get('/active', getActiveSessions);

// Admin only
router.post('/force-logout', requireAdmin, forceLogoutSession);
router.get('/admin/online', requireAdmin, getOnlineUsers);

export default router;
