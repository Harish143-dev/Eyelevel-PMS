import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const createDepartment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDepartments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDepartmentById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateDepartment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteDepartment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const assignUsersToDepartment: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=department.controller.d.ts.map