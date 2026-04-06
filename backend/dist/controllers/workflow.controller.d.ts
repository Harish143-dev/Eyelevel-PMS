import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getStatuses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const reorderStatuses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPriorities: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPriority: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePriority: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePriority: (req: AuthRequest, res: Response) => Promise<void>;
export declare const reorderPriorities: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=workflow.controller.d.ts.map