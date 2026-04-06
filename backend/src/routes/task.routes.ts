import { Router } from 'express';
import {
  getProjectTasks, getTaskById, createTask, updateTask, deleteTask,
  updateTaskStatus, assignTask, updateTaskPosition, getMyTasks,
  getSubtasks, createSubtask, addDependency, removeDependency,
  getDeletedTasks, restoreTask, getTasks
} from '../controllers/task.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireStaff } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTaskSchema, updateTaskSchema, updateStatusSchema,
  addDependencySchema, createSubtaskSchema
} from '../validators/task.validator';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('taskManagement'));

// Project-scoped task routes
router.get('/projects/:id/tasks', checkPermission(Permission.TASK_VIEW), getProjectTasks);
router.post('/projects/:id/tasks', checkPermission(Permission.TASK_CREATE), validate(createTaskSchema), createTask);

// Task-specific routes
router.get('/tasks', checkPermission(Permission.TASK_VIEW), getTasks);
router.get('/tasks/my', checkPermission(Permission.TASK_VIEW), getMyTasks);
router.get('/tasks/deleted', requireStaff, checkPermission(Permission.TASK_VIEW), getDeletedTasks);
router.get('/tasks/:id', checkPermission(Permission.TASK_VIEW), getTaskById);
router.patch('/tasks/:id/restore', requireStaff, checkPermission(Permission.TASK_EDIT), restoreTask);
router.put('/tasks/:id', checkPermission(Permission.TASK_EDIT), validate(updateTaskSchema), updateTask);
router.delete('/tasks/:id', checkPermission(Permission.TASK_DELETE), deleteTask);
router.patch('/tasks/:id/status', checkPermission(Permission.TASK_EDIT), validate(updateStatusSchema), updateTaskStatus);
router.patch('/tasks/:id/assign', checkPermission(Permission.TASK_ASSIGN), assignTask);
router.patch('/tasks/:id/position', checkPermission(Permission.TASK_EDIT), updateTaskPosition);

// Subtask routes
router.get('/tasks/:id/subtasks', checkPermission(Permission.TASK_VIEW), getSubtasks);
router.post('/tasks/:id/subtasks', checkPermission(Permission.TASK_CREATE), validate(createSubtaskSchema), createSubtask);

// Task Dependencies
router.post('/tasks/:id/dependencies', checkPermission(Permission.TASK_EDIT), validate(addDependencySchema), addDependency);
router.delete('/tasks/:id/dependencies/:blockingTaskId', checkPermission(Permission.TASK_EDIT), removeDependency);

export default router;

