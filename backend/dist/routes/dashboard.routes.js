"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.get('/admin', role_middleware_1.requireManager, dashboard_controller_1.getAdminDashboard);
router.get('/user', dashboard_controller_1.getUserDashboard);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map