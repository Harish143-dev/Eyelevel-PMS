"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use(role_middleware_1.requireAdmin);
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.ACTIVITY_LOG_VIEW), activity_controller_1.getActivities);
exports.default = router;
//# sourceMappingURL=activity.routes.js.map