"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use(role_middleware_1.requireStaff);
router.get('/pending-users', admin_controller_1.getPendingUsers);
router.get('/pending-count', admin_controller_1.getPendingCount);
router.patch('/users/:id/approve', admin_controller_1.approveUser);
router.patch('/users/:id/reject', admin_controller_1.rejectUser);
router.patch('/users/:id/deactivate', admin_controller_1.deactivateUser);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map