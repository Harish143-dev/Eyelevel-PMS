import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getOKRs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createOKR: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateOKR: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteOKR: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getReviews: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createReview: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=performance.controller.d.ts.map