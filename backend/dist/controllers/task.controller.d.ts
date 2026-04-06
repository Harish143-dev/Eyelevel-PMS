import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getProjectTasks: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMyTasks: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTasks: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTaskById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDeletedTasks: (req: AuthRequest, res: Response) => Promise<void>;
export declare const restoreTask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTaskStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const assignTask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTaskPosition: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSubtasks: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createSubtask: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addDependency: (req: AuthRequest, res: Response) => Promise<void>;
export declare const removeDependency: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=task.controller.d.ts.map