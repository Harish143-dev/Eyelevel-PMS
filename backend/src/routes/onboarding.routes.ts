import { Router } from 'express';
import {
  getOnboardingStatus,
  onboardingStep1,
  onboardingStep2,
  onboardingStep3,
  onboardingStep4,
  completeOnboarding,
} from '../controllers/onboarding.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyJWT);

router.get('/status', getOnboardingStatus);
router.post('/step-1', onboardingStep1);
router.post('/step-2', onboardingStep2);
router.post('/step-3', onboardingStep3);
router.post('/step-4', onboardingStep4);
router.post('/complete', completeOnboarding);

export default router;
