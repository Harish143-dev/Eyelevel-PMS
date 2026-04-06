"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const feature_middleware_1 = require("../middleware/feature.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const permissions_1 = require("../config/permissions");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.use((0, feature_middleware_1.checkFeature)('taskManagement'));
// Project-scoped task routes
router.get('/projects/:id/tasks', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_VIEW), task_controller_1.getProjectTasks);
router.post('/projects/:id/tasks', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_CREATE), task_controller_1.createTask);
// Task-specific routes
router.get('/tasks', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_VIEW), task_controller_1.getTasks);
router.get('/tasks/my', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_VIEW), task_controller_1.getMyTasks);
router.get('/tasks/deleted', role_middleware_1.requireStaff, (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_VIEW), task_controller_1.getDeletedTasks);
router.get('/tasks/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_VIEW), task_controller_1.getTaskById);
router.patch('/tasks/:id/restore', role_middleware_1.requireStaff, (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_EDIT), task_controller_1.restoreTask);
router.put('/tasks/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_EDIT), task_controller_1.updateTask);
router.delete('/tasks/:id', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_DELETE), task_controller_1.deleteTask);
router.patch('/tasks/:id/status', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_EDIT), task_controller_1.updateTaskStatus);
router.patch('/tasks/:id/assign', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_ASSIGN), task_controller_1.assignTask);
router.patch('/tasks/:id/position', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_EDIT), task_controller_1.updateTaskPosition);
// Subtask routes
router.get('/tasks/:id/subtasks', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_VIEW), task_controller_1.getSubtasks);
router.post('/tasks/:id/subtasks', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_CREATE), task_controller_1.createSubtask);
// Task Dependencies
router.post('/tasks/:id/dependencies', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_EDIT), task_controller_1.addDependency);
router.delete('/tasks/:id/dependencies/:blockingTaskId', (0, permission_middleware_1.checkPermission)(permissions_1.Permission.TASK_EDIT), task_controller_1.removeDependency);
exports.default = router;
//# sourceMappingURL=task.routes.js.map