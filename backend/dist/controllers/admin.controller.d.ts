import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getPendingUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPendingCount: (req: AuthRequest, res: Response) => Promise<void>;
export declare const approveUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const rejectUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deactivateUser: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map