"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
// /me should be high priority for session restored on load, apply limiter
router.get('/me', rateLimit_middleware_1.authLimiter, auth_middleware_1.verifyJWT, auth_controller_1.getMe);
router.post('/register', rateLimit_middleware_1.authLimiter, (0, validate_middleware_1.validate)(auth_validator_1.registerSchema), auth_controller_1.register);
router.post('/login', rateLimit_middleware_1.authLimiter, (0, validate_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.login);
router.post('/logout', auth_middleware_1.verifyJWT, auth_controller_1.logout);
router.post('/refresh', auth_controller_1.refresh);
router.post('/forgot-password', rateLimit_middleware_1.authLimiter, (0, validate_middleware_1.validate)(auth_validator_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password/:token', rateLimit_middleware_1.authLimiter, (0, validate_middleware_1.validate)(auth_validator_1.resetPasswordSchema), auth_controller_1.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map