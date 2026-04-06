import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getClients: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getClientById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createClient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateClient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteClient: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=client.controller.d.ts.map