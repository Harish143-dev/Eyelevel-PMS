import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const checkIn: (req: AuthRequest, res: Response) => Promise<void>;
export declare const checkOut: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTodayStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAttendanceLogs: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=attendance.controller.d.ts.map