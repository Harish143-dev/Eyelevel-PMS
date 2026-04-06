import { Router } from 'express';
import { getStatuses, createStatus, updateStatus, deleteStatus, reorderStatuses, getPriorities, createPriority, updatePriority, deletePriority, reorderPriorities } from '../controllers/workflow.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(verifyJWT);

// Statuses
router.get('/statuses', getStatuses);
router.post('/statuses', requireRole('admin'), createStatus);
router.put('/statuses/reorder', requireRole('admin'), reorderStatuses);
router.put('/statuses/:id', requireRole('admin'), updateStatus);
router.delete('/statuses/:id', requireRole('admin'), deleteStatus);

// Priorities
router.get('/priorities', getPriorities);
router.post('/priorities', requireRole('admin'), createPriority);
router.put('/priorities/reorder', requireRole('admin'), reorderPriorities);
router.put('/priorities/:id', requireRole('admin'), updatePriority);
router.delete('/priorities/:id', requireRole('admin'), deletePriority);

export default router;

