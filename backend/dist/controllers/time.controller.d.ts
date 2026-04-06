import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const startTimer: (req: AuthRequest, res: Response) => Promise<void>;
export declare const stopTimer: (req: AuthRequest, res: Response) => Promise<void>;
export declare const logTimeManual: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTimeLogs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getRunningTimer: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTimeLog: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=time.controller.d.ts.map