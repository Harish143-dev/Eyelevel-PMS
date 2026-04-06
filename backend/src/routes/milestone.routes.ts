import { Router } from 'express';
import {
  createMilestone,
  getProjectMilestones,
  updateMilestone,
  deleteMilestone
} from '../controllers/milestone.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router({ mergeParams: true });

router.use(verifyJWT);

// Sub-route for /api/projects/:projectId/milestones
router.get('/', getProjectMilestones);
router.post('/', createMilestone);
router.put('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

export default router;
