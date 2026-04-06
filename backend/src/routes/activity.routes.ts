import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';
import { checkFeature } from '../middleware/feature.middleware';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('auditLogs'));
router.use(requireAdmin);

router.get('/', checkPermission(Permission.ACTIVITY_LOG_VIEW), getActivities);

export default router;
