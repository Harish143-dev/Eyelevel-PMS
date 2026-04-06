import { Router } from 'express';
import { exportTasks, exportProjects, exportEmployees } from '../controllers/data.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../middleware/role.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';
import { Role } from '../config/roles';

const router = Router();

router.use(verifyJWT);
router.use(requireRole(Role.ADMIN)); // Only admins can reach global data tools

// CSV Exports
router.get('/export/tasks', exportTasks);
router.get('/export/projects', exportProjects);
router.get('/export/employees', exportEmployees);

export default router;
