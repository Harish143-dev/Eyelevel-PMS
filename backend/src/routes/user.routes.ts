import { Router } from 'express';
import { getUsers, getActiveUsers, getUserById, createUser, updateUser, updateUserRole, updateUserStatus, updatePassword, deleteUser, getPreferences, updatePreferences } from '../controllers/user.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole, requireStaff, requireAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema, updateRoleSchema, updateStatusSchema } from '../validators/user.validator';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

import { Role } from '../config/roles';

import { sensitiveLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

router.get('/', requireStaff, checkPermission(Permission.USER_VIEW), getUsers);
router.get('/active', checkPermission(Permission.USER_VIEW), getActiveUsers);
router.get('/:id', checkPermission(Permission.USER_VIEW), getUserById);
router.post('/', requireStaff, checkPermission(Permission.USER_CREATE), validate(createUserSchema), createUser);
router.put('/:id', validate(updateUserSchema), updateUser);
router.patch('/:id/password', updatePassword);
router.patch('/:id/role', requireAdmin, checkPermission(Permission.USER_MANAGE_ROLES), validate(updateRoleSchema), updateUserRole);
router.patch('/:id/status', requireStaff, checkPermission(Permission.USER_APPROVE), validate(updateStatusSchema), updateUserStatus);
router.delete('/:id', sensitiveLimiter, requireRole(Role.ADMIN), checkPermission(Permission.USER_DELETE), deleteUser);

export default router;
