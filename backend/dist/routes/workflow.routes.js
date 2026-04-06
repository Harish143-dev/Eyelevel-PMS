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
router.put('/statuses/:id', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.updateStatus);
router.delete('/statuses/:id', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.deleteStatus);
// Priorities
router.get('/priorities', workflow_controller_1.getPriorities);
router.post('/priorities', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.createPriority);
router.put('/priorities/reorder', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.reorderPriorities);
router.put('/priorities/:id', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.updatePriority);
router.delete('/priorities/:id', (0, role_middleware_1.requireRole)('admin'), workflow_controller_1.deletePriority);
exports.default = router;
//# sourceMappingURL=workflow.routes.js.map