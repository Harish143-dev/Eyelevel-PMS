import { Router } from 'express';
import { getDailySummary, acceptConsent } from '../controllers/monitoring.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../middleware/role.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);

// Both Admin and HR might be able to see this info
router.get('/daily', requireRole('admin', 'hr', 'manager'), getDailySummary);

// Any user can interact to grant consent
router.post('/consent', acceptConsent);

export default router;
