import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const recordHeartbeat: (req: AuthRequest, res: Response) => Promise<void>;
export declare const recordBatchHeartbeats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDailySummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyActivityStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTeamSummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminLiveStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAnomalies: (req: AuthRequest, res: Response) => Promise<void>;
export declare const exportSummariesCSV: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=activityTracking.controller.d.ts.map