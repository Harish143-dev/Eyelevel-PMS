import { Router } from 'express';
import { getActivities } from '../controllers/activity.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(verifyJWT);
router.use(requireRole('admin'));

router.get('/', getActivities);

export default router;
