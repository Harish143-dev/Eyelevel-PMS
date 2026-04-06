import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getChannels: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createChannel: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMessages: (req: AuthRequest, res: Response) => Promise<void>;
export declare const postMessage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateMessage: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteMessage: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=chat.controller.d.ts.map