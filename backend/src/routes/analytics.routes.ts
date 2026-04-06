import { Router } from 'express';
import { 
  getProjectWorkload, 
  getProjectBurndown, 
  getGlobalWorkload,
  getProductivityHeatmap,
  getSystemStats,
  getTeamComparison,
  getProjectCost,
  getReportExport
} from '../controllers/analytics.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireStaff } from '../middleware/role.middleware';
import { checkFeature } from '../middleware/feature.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { Permission } from '../config/permissions';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('analytics'));

router.get('/workload', requireStaff, checkPermission(Permission.ANALYTICS_VIEW), getGlobalWorkload);
router.get('/projects/:projectId/workload', checkPermission(Permission.ANALYTICS_VIEW), getProjectWorkload);
router.get('/projects/:projectId/burndown', checkPermission(Permission.ANALYTICS_VIEW), getProjectBurndown);
router.get('/productivity-heatmap', checkPermission(Permission.ANALYTICS_VIEW), getProductivityHeatmap);
router.get('/system-stats', requireStaff, checkPermission(Permission.ANALYTICS_VIEW), getSystemStats);
router.get('/team-comparison', requireStaff, checkPermission(Permission.ANALYTICS_VIEW), getTeamComparison);
router.get('/project-cost', requireStaff, checkPermission(Permission.ANALYTICS_VIEW), getProjectCost);
router.get('/report-export', requireStaff, checkPermission(Permission.ANALYTICS_VIEW), getReportExport);

export default router;
