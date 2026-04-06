import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';
import {
  recordHeartbeat,
  recordBatchHeartbeats,
  getDailySummary,
  getMyActivityStatus,
  getTeamSummary,
  getAdminLiveStatus,
  getAnomalies,
  exportSummariesCSV,
} from '../controllers/activityTracking.controller';

const router = Router();

router.use(verifyJWT);

// Heartbeat endpoints
router.post('/', recordHeartbeat);
router.post('/batch', recordBatchHeartbeats);

// Summary endpoints
router.get('/summary/:userId', getDailySummary);
router.get('/my-status', getMyActivityStatus);

// Admin endpoints
router.get('/admin/team-summary', requireAdmin, getTeamSummary);
router.get('/admin/live', requireAdmin, getAdminLiveStatus);
router.get('/admin/anomalies', requireAdmin, getAnomalies);
router.get('/admin/export', requireAdmin, exportSummariesCSV);

export default router;
