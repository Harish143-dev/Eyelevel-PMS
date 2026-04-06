"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const template_controller_1 = require("../controllers/template.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('templates'));
// All template routes require admin or super_admin
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TEMPLATE_VIEW), template_controller_1.getTemplates);
router.get('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TEMPLATE_VIEW), template_controller_1.getTemplateById);
router.post('/', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TEMPLATE_CREATE), template_controller_1.createTemplate);
router.post('/from-project/:projectId', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TEMPLATE_CREATE), template_controller_1.createTemplateFromProject);
router.put('/:id', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TEMPLATE_EDIT), template_controller_1.updateTemplate);
router.delete('/:id', (0, role_middleware_1.requireRole)(roles_1.Role.MANAGER, roles_1.Role.ADMIN), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TEMPLATE_DELETE), template_controller_1.deleteTemplate);
exports.default = router;
//# sourceMappingURL=template.routes.js.map