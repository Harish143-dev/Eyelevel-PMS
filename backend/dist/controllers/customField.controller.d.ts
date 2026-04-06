import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getCustomFields: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCustomField: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCustomField: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteCustomField: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCustomFieldValues: (req: AuthRequest, res: Response) => Promise<void>;
export declare const upsertCustomFieldValues: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=customField.controller.d.ts.map