"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.ROLE_VIEW), role_controller_1.getRoles);
router.get('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.ROLE_VIEW), role_controller_1.getRoleById);
router.post('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.ROLE_CREATE), role_controller_1.createRole);
router.put('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.ROLE_EDIT), role_controller_1.updateRole);
router.delete('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.ROLE_DELETE), role_controller_1.deleteRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map