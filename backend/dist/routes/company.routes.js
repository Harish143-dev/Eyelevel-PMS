"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
// Current user's company
router.get('/my', company_controller_1.getMyCompany);
// Super admin / platform routes
router.get('/', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_MANAGE), company_controller_1.getCompanies);
router.get('/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_MANAGE), company_controller_1.getCompanyById);
router.patch('/:id/features', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.FEATURE_TOGGLE), company_controller_1.updateCompanyFeatures);
router.patch('/:id/status', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_MANAGE), company_controller_1.updateCompanyStatus);
exports.default = router;
//# sourceMappingURL=company.routes.js.map