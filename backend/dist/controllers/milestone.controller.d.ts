import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const createMilestone: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProjectMilestones: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateMilestone: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteMilestone: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=milestone.controller.d.ts.map