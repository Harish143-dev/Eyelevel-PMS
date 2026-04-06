import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getTemplates: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTemplateById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTemplate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTemplateFromProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTemplate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTemplate: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=template.controller.d.ts.map