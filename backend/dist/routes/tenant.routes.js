"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_controller_1 = require("../controllers/tenant.controller");
const router = (0, express_1.Router)();
// Public route to resolve company branding by hostname or slug
router.get('/resolve', tenant_controller_1.resolveTenantBranding);
exports.default = router;
//# sourceMappingURL=tenant.routes.js.map