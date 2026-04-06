"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milestone_controller_1 = require("../controllers/milestone.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.verifyJWT);
// Sub-route for /api/projects/:projectId/milestones
router.get('/', milestone_controller_1.getProjectMilestones);
router.post('/', milestone_controller_1.createMilestone);
router.put('/:id', milestone_controller_1.updateMilestone);
router.delete('/:id', milestone_controller_1.deleteMilestone);
exports.default = router;
//# sourceMappingURL=milestone.routes.js.map