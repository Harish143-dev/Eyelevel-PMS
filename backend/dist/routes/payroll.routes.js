"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payroll_controller_1 = require("../controllers/payroll.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('payroll'));
// HR / Admin Management
router.get('/salaries', (0, role_middleware_1.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PAYROLL_MANAGE), payroll_controller_1.getAllSalaries);
router.put('/salaries/:userId', (0, role_middleware_1.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PAYROLL_MANAGE), payroll_controller_1.updateSalary);
router.post('/payslips/generate', (0, role_middleware_1.requireRole)(roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR), (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PAYROLL_MANAGE), payroll_controller_1.generatePayslip);
// Employee Self-Service (Roles enforced in controller)
router.get('/salaries/:userId', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PAYROLL_VIEW), payroll_controller_1.getSalaryByUser);
router.get('/payslips/:userId', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PAYROLL_VIEW), payroll_controller_1.getPayslipsByUser);
exports.default = router;
//# sourceMappingURL=payroll.routes.js.map