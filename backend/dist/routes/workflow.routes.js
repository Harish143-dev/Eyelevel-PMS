"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflow_controller_1 = require("../controllers/workflow.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
// Statuses
router.get('/statuses', workflow_controller_1.getStatuses);
router.post('/statuses', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.createStatus);
router.put('/statuses/reorder', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.reorderStatuses);
// Priorities
router.get('/priorities', workflow_controller_1.getPriorities);
exports.default = router;
//# sourceMappingURL=workflow.routes.js.map