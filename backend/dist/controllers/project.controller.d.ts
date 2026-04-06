import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getProjects: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCategories: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProjectById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createProject: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDeletedProjects: (req: AuthRequest, res: Response) => Promise<void>;
export declare const restoreProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addMember: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addDepartmentMembers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const removeMember: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMembers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const archiveProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const unarchiveProject: (req: AuthRequest, res: Response) => Promise<void>;
export declare const setProjectManager: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=project.controller.d.ts.map