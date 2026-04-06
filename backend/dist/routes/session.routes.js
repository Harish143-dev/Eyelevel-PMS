"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const session_controller_1 = require("../controllers/session.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.post('/login', session_controller_1.createSession);
router.post('/logout', session_controller_1.endSession);
router.get('/active', session_controller_1.getActiveSessions);
// Admin only
router.post('/force-logout', role_middleware_1.requireAdmin, session_controller_1.forceLogoutSession);
router.get('/admin/online', role_middleware_1.requireAdmin, session_controller_1.getOnlineUsers);
exports.default = router;
//# sourceMappingURL=session.routes.js.map