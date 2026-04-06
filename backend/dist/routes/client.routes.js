"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('clientManagement'));
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.CLIENT_VIEW), client_controller_1.getClients);
router.get('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.CLIENT_VIEW), client_controller_1.getClientById);
// Admin / Super Admin / Manager / HR only
router.post('/', (0, role_middleware_1.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.CLIENT_CREATE), client_controller_1.createClient);
router.put('/:id', (0, role_middleware_1.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.CLIENT_EDIT), client_controller_1.updateClient);
router.delete('/:id', (0, role_middleware_1.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.CLIENT_DELETE), client_controller_1.deleteClient);
exports.default = router;
//# sourceMappingURL=client.routes.js.map