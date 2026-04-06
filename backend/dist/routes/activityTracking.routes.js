"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const activityTracking_controller_1 = require("../controllers/activityTracking.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
// Heartbeat endpoints
router.post('/', activityTracking_controller_1.recordHeartbeat);
router.post('/batch', activityTracking_controller_1.recordBatchHeartbeats);
// Summary endpoints
router.get('/summary/:userId', activityTracking_controller_1.getDailySummary);
router.get('/my-status', activityTracking_controller_1.getMyActivityStatus);
// Admin endpoints
router.get('/admin/team-summary', role_middleware_1.requireAdmin, activityTracking_controller_1.getTeamSummary);
router.get('/admin/live', role_middleware_1.requireAdmin, activityTracking_controller_1.getAdminLiveStatus);
router.get('/admin/anomalies', role_middleware_1.requireAdmin, activityTracking_controller_1.getAnomalies);
router.get('/admin/export', role_middleware_1.requireAdmin, activityTracking_controller_1.exportSummariesCSV);
exports.default = router;
//# sourceMappingURL=activityTracking.routes.js.map