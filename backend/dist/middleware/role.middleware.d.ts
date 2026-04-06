import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
export declare const requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireManager: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireHR: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireStaff: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map