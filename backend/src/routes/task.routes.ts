import { Router } from 'express';
import {
  getProjectTasks, getTaskById, createTask, updateTask, deleteTask,
  updateTaskStatus, assignTask, updateTaskPosition, getMyTasks,
} from '../controllers/task.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyJWT);

// Project-scoped task routes
router.get('/projects/:id/tasks', getProjectTasks);
router.post('/projects/:id/tasks', createTask);

// Task-specific routes
router.get('/tasks/my', getMyTasks);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.patch('/tasks/:id/status', updateTaskStatus);
router.patch('/tasks/:id/assign', assignTask);
router.patch('/tasks/:id/position', updateTaskPosition);

export default router;
