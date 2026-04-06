"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_middleware_1.validate)(auth_validator_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validate_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.login);
router.post('/logout', auth_middleware_1.verifyJWT, auth_controller_1.logout);
router.post('/refresh', auth_controller_1.refresh);
router.post('/forgot-password', (0, validate_middleware_1.validate)(auth_validator_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password/:token', (0, validate_middleware_1.validate)(auth_validator_1.resetPasswordSchema), auth_controller_1.resetPassword);
router.get('/me', auth_middleware_1.verifyJWT, auth_controller_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map