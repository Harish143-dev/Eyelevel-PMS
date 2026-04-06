"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboarding_controller_1 = require("../controllers/onboarding.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyJWT);
router.get('/status', onboarding_controller_1.getOnboardingStatus);
router.post('/step-1', onboarding_controller_1.onboardingStep1);
router.post('/step-2', onboarding_controller_1.onboardingStep2);
router.post('/step-3', onboarding_controller_1.onboardingStep3);
router.post('/step-4', onboarding_controller_1.onboardingStep4);
router.post('/complete', onboarding_controller_1.completeOnboarding);
exports.default = router;
//# sourceMappingURL=onboarding.routes.js.map