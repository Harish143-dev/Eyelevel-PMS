"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const roles_1 = require("../config/roles");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('projectManagement'));
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_VIEW), project_controller_1.getProjects);
router.get('/deleted', role_middleware_1.requireStaff, (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_VIEW), project_controller_1.getDeletedProjects);
router.get('/categories', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_VIEW), project_controller_1.getCategories);
router.get('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_VIEW), project_controller_1.getProjectById);
router.patch('/:id/restore', role_middleware_1.requireStaff, (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_EDIT), project_controller_1.restoreProject);
router.post('/', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_CREATE), project_controller_1.createProject);
router.put('/:id', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_EDIT), project_controller_1.updateProject);
router.delete('/:id', rateLimit_middleware_1.sensitiveLimiter, (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_DELETE), project_controller_1.deleteProject);
// Members
router.get('/:id/members', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_VIEW), project_controller_1.getMembers);
router.post('/:id/members', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_MANAGE_MEMBERS), project_controller_1.addMember);
router.post('/:id/members/department/:departmentId', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_MANAGE_MEMBERS), project_controller_1.addDepartmentMembers);
router.delete('/:id/members/:userId', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_MANAGE_MEMBERS), project_controller_1.removeMember);
// Archive
router.patch('/:id/archive', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_ARCHIVE), project_controller_1.archiveProject);
router.patch('/:id/unarchive', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_ARCHIVE), project_controller_1.unarchiveProject);
// Project Manager
router.patch('/:id/manager', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PROJECT_EDIT), project_controller_1.setProjectManager);
exports.default = router;
//# sourceMappingURL=project.routes.js.map