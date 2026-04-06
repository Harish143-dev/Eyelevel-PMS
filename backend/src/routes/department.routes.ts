import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignUsersToDepartment
} from '../controllers/department.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';
import { checkFeature } from '../middleware/feature.middleware';

const router = express.Router();

router.use(verifyJWT);
router.use(checkFeature('hrManagement'));

router.get('/', checkPermission(Permission.DEPARTMENT_VIEW), getDepartments);
router.get('/:id', checkPermission(Permission.DEPARTMENT_VIEW), getDepartmentById);

// Admin only routes
router.use(requireAdmin);
router.post('/', checkPermission(Permission.DEPARTMENT_CREATE), createDepartment);
router.put('/:id', checkPermission(Permission.DEPARTMENT_EDIT), updateDepartment);
router.delete('/:id', checkPermission(Permission.DEPARTMENT_DELETE), deleteDepartment);
router.post('/:id/users', checkPermission(Permission.DEPARTMENT_EDIT), assignUsersToDepartment);

export default router;
