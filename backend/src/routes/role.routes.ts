import { Router } from 'express';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/role.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);

router.get('/', checkPermission(Permission.ROLE_VIEW), getRoles);
router.get('/:id', checkPermission(Permission.ROLE_VIEW), getRoleById);
router.post('/', checkPermission(Permission.ROLE_CREATE), createRole);
router.put('/:id', checkPermission(Permission.ROLE_EDIT), updateRole);
router.delete('/:id', checkPermission(Permission.ROLE_DELETE), deleteRole);

export default router;
