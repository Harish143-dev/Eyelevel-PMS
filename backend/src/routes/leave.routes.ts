import { Router } from 'express';
import { getMyLeaves, applyLeave, getAllLeaves, updateLeaveStatus } from '../controllers/leave.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole, requireStaff } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

import { Role } from '../config/roles';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('leaveManagement'));

// User routes
router.get('/my-leaves', checkPermission(Permission.LEAVE_VIEW), getMyLeaves);
router.post('/apply', checkPermission(Permission.LEAVE_VIEW), applyLeave);

// Admin routes
router.get('/all', requireStaff, checkPermission(Permission.LEAVE_MANAGE), getAllLeaves);
router.patch('/:id/status', requireStaff, checkPermission(Permission.LEAVE_MANAGE), updateLeaveStatus);

export default router;
