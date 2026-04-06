import { Router } from 'express';
import {
  getTemplates, getTemplateById, createTemplate,
  createTemplateFromProject, updateTemplate, deleteTemplate
} from '../controllers/template.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

import { Role } from '../config/roles';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('templates'));

// All template routes require admin or super_admin
router.get('/', checkPermission(Permission.TEMPLATE_VIEW), getTemplates);
router.get('/:id', checkPermission(Permission.TEMPLATE_VIEW), getTemplateById);
router.post('/', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.TEMPLATE_CREATE), createTemplate);
router.post('/from-project/:projectId', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.TEMPLATE_CREATE), createTemplateFromProject);
router.put('/:id', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.TEMPLATE_EDIT), updateTemplate);
router.delete('/:id', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.TEMPLATE_DELETE), deleteTemplate);

export default router;
