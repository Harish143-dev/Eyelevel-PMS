"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFeature = void 0;
const db_1 = __importDefault(require("../config/db"));
/**
 * Middleware to check if a feature is enabled for the user's company.
 * If the feature is disabled, the request is rejected with a 403.
 *
 * Usage: router.use(checkFeature('teamChat'));
 */
const checkFeature = (featureKey) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            // companyId is already on req.user (set by verifyJWT) — no extra User query needed.
            const companyId = req.user.companyId;
            if (!companyId) {
                // No company = no feature gating (legacy/solo users pass through)
                next();
                return;
            }
            const company = await db_1.default.company.findUnique({
                where: { id: companyId },
                select: { features: true, status: true },
            });
            if (!company) {
                res.status(404).json({ message: 'Company not found' });
                return;
            }
            if (company.status !== 'active') {
                res.status(403).json({ message: 'Company account is suspended' });
                return;
            }
            const features = company.features || {};
            // If the feature key exists and is explicitly false, block access
            if (features[featureKey] === false) {
                res.status(403).json({
                    message: `The "${featureKey}" feature is disabled for your organization`,
                    featureDisabled: true,
                    featureKey,
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};
exports.checkFeature = checkFeature;
//# sourceMappingURL=feature.middleware.js.map