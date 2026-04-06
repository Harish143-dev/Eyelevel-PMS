import { Response as ExResponse } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getProjectDocuments: (req: AuthRequest, res: ExResponse) => Promise<void>;
export declare const getDocumentById: (req: AuthRequest, res: ExResponse) => Promise<void>;
export declare const createDocument: (req: AuthRequest, res: ExResponse) => Promise<void>;
export declare const updateDocument: (req: AuthRequest, res: ExResponse) => Promise<void>;
export declare const deleteDocument: (req: AuthRequest, res: ExResponse) => Promise<void>;
//# sourceMappingURL=document.controller.d.ts.map