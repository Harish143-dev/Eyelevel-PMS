import { Router } from 'express';
import {
  getOKRs,
  createOKR,
  updateOKR,
  deleteOKR,
  getReviews,
  createReview
} from '../controllers/performance.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('performance'));

// OKRs
router.get('/okrs', checkPermission(Permission.PERFORMANCE_VIEW), getOKRs);
router.post('/okrs', checkPermission(Permission.PERFORMANCE_MANAGE), createOKR);
router.put('/okrs/:id', checkPermission(Permission.PERFORMANCE_MANAGE), updateOKR);
router.delete('/okrs/:id', checkPermission(Permission.PERFORMANCE_MANAGE), deleteOKR);

// Performance Reviews
router.get('/reviews', checkPermission(Permission.PERFORMANCE_VIEW), getReviews);
router.post('/reviews', checkPermission(Permission.PERFORMANCE_MANAGE), createReview);

export default router;
