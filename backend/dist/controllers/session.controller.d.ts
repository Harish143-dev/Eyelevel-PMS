import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const createSession: (req: AuthRequest, res: Response) => Promise<void>;
export declare const endSession: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getActiveSessions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const forceLogoutSession: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getOnlineUsers: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=session.controller.d.ts.map