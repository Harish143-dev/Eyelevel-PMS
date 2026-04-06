import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * GET /api/companies
 * List all companies (super admin / platform admin).
 */
export declare const getCompanies: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/companies/:id
 * Get a single company's details.
 */
export declare const getCompanyById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /api/companies/:id/features
 * Toggle features for a company.
 * Body: { features: { projectManagement: true, teamChat: false, ... } }
 */
export declare const updateCompanyFeatures: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PATCH /api/companies/:id/status
 * Update a company's status (active, suspended, etc.)
 * Body: { status }
 */
export declare const updateCompanyStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/companies/my
 * Get the current user's company with full details.
 */
export declare const getMyCompany: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=company.controller.d.ts.map