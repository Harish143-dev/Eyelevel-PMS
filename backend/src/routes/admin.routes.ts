import { Router } from 'express';
import {
  getPendingUsers, getPendingCount, approveUser, rejectUser, deactivateUser,
} from '../controllers/admin.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole, requireStaff } from '../middleware/role.middleware';

import { Role } from '../config/roles';

const router = Router();

router.use(verifyJWT);
router.use(requireStaff);

router.get('/pending-users', getPendingUsers);
router.get('/pending-count', getPendingCount);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);
router.patch('/users/:id/deactivate', deactivateUser);

export default router;
