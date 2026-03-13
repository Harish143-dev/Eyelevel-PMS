import { Router } from 'express';
import {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  addMember, removeMember,
} from '../controllers/project.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requireRole('admin'), createProject);
router.put('/:id', requireRole('admin'), updateProject);
router.delete('/:id', requireRole('admin'), deleteProject);
router.post('/:id/members', requireRole('admin'), addMember);
router.delete('/:id/members/:userId', requireRole('admin'), removeMember);

export default router;
