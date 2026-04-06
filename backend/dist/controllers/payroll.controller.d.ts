import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAllSalaries: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSalaryByUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateSalary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const generatePayslip: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPayslipsByUser: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=payroll.controller.d.ts.map