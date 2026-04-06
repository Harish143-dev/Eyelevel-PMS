import { Router } from 'express';
import {
  getAllSalaries,
  getSalaryByUser,
  updateSalary,
  generatePayslip,
  getPayslipsByUser
} from '../controllers/payroll.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

import { Role } from '../config/roles';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('payroll'));

// HR / Admin Management
router.get('/salaries', requireRole(Role.ADMIN, Role.MANAGER, Role.HR), checkPermission(Permission.PAYROLL_MANAGE), getAllSalaries);
router.put('/salaries/:userId', requireRole(Role.ADMIN, Role.MANAGER, Role.HR), checkPermission(Permission.PAYROLL_MANAGE), updateSalary);
router.post('/payslips/generate', requireRole(Role.ADMIN, Role.MANAGER, Role.HR), checkPermission(Permission.PAYROLL_MANAGE), generatePayslip);

// Employee Self-Service (Roles enforced in controller)
router.get('/salaries/:userId', checkPermission(Permission.PAYROLL_VIEW), getSalaryByUser);
router.get('/payslips/:userId', checkPermission(Permission.PAYROLL_VIEW), getPayslipsByUser);

export default router;
