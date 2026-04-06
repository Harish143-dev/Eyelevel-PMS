"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_controller_1 = require("../controllers/data.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const roles_1 = require("../config/roles");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, role_middleware_1.requireRole)(roles_1.Role.ADMIN)); // Only admins can reach global data tools
// CSV Exports
router.get('/export/tasks', data_controller_1.exportTasks);
router.get('/export/projects', data_controller_1.exportProjects);
router.get('/export/employees', data_controller_1.exportEmployees);
exports.default = router;
//# sourceMappingURL=data.routes.js.map