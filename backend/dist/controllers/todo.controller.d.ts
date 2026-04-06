import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getTodos: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTodo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateTodo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteTodo: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=todo.controller.d.ts.map