"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordWithSettings = void 0;
const db_1 = __importDefault(require("../config/db"));
const validatePasswordWithSettings = async (password, companyId) => {
    // If no companyId (super admin or creating first admin during signup),
    // enforce a safe default strong policy.
    let policy = {
        minLength: 8,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: true,
    };
    if (companyId) {
        const settings = await db_1.default.companySettings.findUnique({
            where: { companyId },
            select: { passwordPolicy: true }
        });
        if (settings?.passwordPolicy) {
            const dbPolicy = settings.passwordPolicy;
            policy = {
                minLength: dbPolicy.minLength || 8,
                requireUppercase: !!dbPolicy.requireUppercase,
                requireNumber: !!dbPolicy.requireNumber,
                requireSpecialChar: !!dbPolicy.requireSpecialChar,
            };
        }
    }
    if (password.length < policy.minLength) {
        return { valid: false, message: `Password must be at least ${policy.minLength} characters long.` };
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (policy.requireNumber && !/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }
    if (policy.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character.' };
    }
    return { valid: true };
};
exports.validatePasswordWithSettings = validatePasswordWithSettings;
//# sourceMappingURL=security.js.map