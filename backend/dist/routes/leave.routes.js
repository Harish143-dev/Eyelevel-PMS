"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leave_controller_1 = require("../controllers/leave.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('leaveManagement'));
// User routes
router.get('/my-leaves', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.LEAVE_VIEW), leave_controller_1.getMyLeaves);
router.post('/apply', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.LEAVE_VIEW), leave_controller_1.applyLeave);
// Admin routes
router.get('/all', role_middleware_1.requireStaff, (0, permission_middleware_1.checkPermission)(permissions_1.Permission.LEAVE_MANAGE), leave_controller_1.getAllLeaves);
router.patch('/:id/status', role_middleware_1.requireStaff, (0, permission_middleware_1.checkPermission)(permissions_1.Permission.LEAVE_MANAGE), leave_controller_1.updateLeaveStatus);
exports.default = router;
//# sourceMappingURL=leave.routes.js.map