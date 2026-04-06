import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAttachments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadAttachment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const downloadAttachment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteAttachment: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=attachment.controller.d.ts.map