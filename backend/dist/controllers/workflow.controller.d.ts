import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getStatuses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const reorderStatuses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPriorities: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=workflow.controller.d.ts.map