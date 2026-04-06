"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const performance_controller_1 = require("../controllers/performance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('performance'));
// OKRs
router.get('/okrs', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PERFORMANCE_VIEW), performance_controller_1.getOKRs);
router.post('/okrs', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PERFORMANCE_MANAGE), performance_controller_1.createOKR);
router.put('/okrs/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PERFORMANCE_MANAGE), performance_controller_1.updateOKR);
router.delete('/okrs/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PERFORMANCE_MANAGE), performance_controller_1.deleteOKR);
// Performance Reviews
router.get('/reviews', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PERFORMANCE_VIEW), performance_controller_1.getReviews);
router.post('/reviews', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.PERFORMANCE_MANAGE), performance_controller_1.createReview);
exports.default = router;
//# sourceMappingURL=performance.routes.js.map