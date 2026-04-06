import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getActiveUsers: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUserRole: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUserStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPreferences: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePreferences: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map