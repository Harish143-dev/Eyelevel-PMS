"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
// Only admins / authorized users with COMPANY_SETTINGS should be able to alter company wide settings
router.get('/company', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_SETTINGS), settings_controller_1.getCompanySettings);
router.put('/company', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.COMPANY_SETTINGS), settings_controller_1.updateCompanySettings);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map