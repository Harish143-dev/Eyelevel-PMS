import { Router } from 'express';
import {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  addMember, addDepartmentMembers, removeMember, getMembers, archiveProject, unarchiveProject,
  setProjectManager, getCategories, getDeletedProjects, restoreProject
} from '../controllers/project.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole, requireStaff } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from '../validators/project.validator';
import { Permission } from '../config/permissions';

import { Role } from '../config/roles';
import { sensitiveLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('projectManagement'));

router.get('/', checkPermission(Permission.PROJECT_VIEW), getProjects);
router.get('/deleted', requireStaff, checkPermission(Permission.PROJECT_VIEW), getDeletedProjects);
router.get('/categories', checkPermission(Permission.PROJECT_VIEW), getCategories);
router.get('/:id', checkPermission(Permission.PROJECT_VIEW), getProjectById);
router.patch('/:id/restore', requireStaff, checkPermission(Permission.PROJECT_EDIT), restoreProject);
router.post('/', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.PROJECT_CREATE), validate(createProjectSchema), createProject);
router.put('/:id', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.PROJECT_EDIT), validate(updateProjectSchema), updateProject);
router.delete('/:id', sensitiveLimiter, requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.PROJECT_DELETE), deleteProject);

// Members
router.get('/:id/members', checkPermission(Permission.PROJECT_VIEW), getMembers);
router.post('/:id/members', checkPermission(Permission.PROJECT_MANAGE_MEMBERS), validate(addMemberSchema), addMember);
router.post('/:id/members/department/:departmentId', checkPermission(Permission.PROJECT_MANAGE_MEMBERS), addDepartmentMembers); 
router.delete('/:id/members/:userId', checkPermission(Permission.PROJECT_MANAGE_MEMBERS), removeMember); 

// Archive
router.patch('/:id/archive', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.PROJECT_ARCHIVE), archiveProject);
router.patch('/:id/unarchive', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.PROJECT_ARCHIVE), unarchiveProject);

// Project Manager
router.patch('/:id/manager', requireRole(Role.MANAGER, Role.ADMIN), checkPermission(Permission.PROJECT_EDIT), setProjectManager);

export default router;
