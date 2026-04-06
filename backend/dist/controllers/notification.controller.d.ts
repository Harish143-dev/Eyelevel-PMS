import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getNotifications: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUnreadCount: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const markAllAsRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteNotification: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=notification.controller.d.ts.map