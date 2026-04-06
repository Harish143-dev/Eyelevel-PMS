import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getMyLeaves: (req: AuthRequest, res: Response) => Promise<void>;
export declare const applyLeave: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllLeaves: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateLeaveStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=leave.controller.d.ts.map