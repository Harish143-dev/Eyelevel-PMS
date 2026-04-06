import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getProjectWorkload: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProjectBurndown: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getGlobalWorkload: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProductivityHeatmap: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSystemStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTeamComparison: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProjectCost: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getReportExport: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=analytics.controller.d.ts.map