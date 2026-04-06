import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAdminDashboard: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserDashboard: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=dashboard.controller.d.ts.map