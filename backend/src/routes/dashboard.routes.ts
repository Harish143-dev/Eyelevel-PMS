import { Router } from 'express';
import { getAdminDashboard, getUserDashboard } from '../controllers/dashboard.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/admin', requireRole('admin'), getAdminDashboard);
router.get('/user', getUserDashboard);

export default router;
