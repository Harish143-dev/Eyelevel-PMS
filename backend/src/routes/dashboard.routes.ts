import { Router } from 'express';
import { getAdminDashboard, getUserDashboard } from '../controllers/dashboard.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole, requireAdmin, requireManager } from '../middleware/role.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/admin', requireManager, getAdminDashboard);
router.get('/user', getUserDashboard);

export default router;
