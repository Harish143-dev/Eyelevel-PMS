"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monitoring_controller_1 = require("../controllers/monitoring.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
// Both Admin and HR might be able to see this info
router.get('/daily', (0, role_middleware_1.requireRole)('admin', 'hr', 'manager'), monitoring_controller_1.getDailySummary);
// Any user can interact to grant consent
router.post('/consent', monitoring_controller_1.acceptConsent);
exports.default = router;
//# sourceMappingURL=monitoring.routes.js.map