import { Router } from 'express';
import * as timeController from '../controllers/time.controller';
import { verifyJWT } from '../middleware/auth.middleware';
import { checkFeature } from '../middleware/feature.middleware';

const router = Router();

router.use(verifyJWT);
router.use(checkFeature('timeTracking'));

router.post('/start', timeController.startTimer);
router.post('/stop', timeController.stopTimer);
router.post('/log', timeController.logTimeManual);
router.get('/logs', timeController.getTimeLogs);
router.get('/running', timeController.getRunningTimer);
router.delete('/logs/:id', timeController.deleteTimeLog);

export default router;
