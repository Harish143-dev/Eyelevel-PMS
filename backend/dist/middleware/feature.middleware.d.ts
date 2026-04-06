import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware to check if a feature is enabled for the user's company.
 * If the feature is disabled, the request is rejected with a 403.
 *
 * Usage: router.use(checkFeature('teamChat'));
 */
export declare const checkFeature: (featureKey: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=feature.middleware.d.ts.map