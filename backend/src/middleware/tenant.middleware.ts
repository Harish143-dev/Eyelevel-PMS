import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Tenant Scoping Middleware
 * 
 * Extracts `companyId` from the authenticated user and attaches it as `req.tenantId`.
 * All downstream controllers should use `req.tenantId` to scope queries.
 * 
 * Rules:
 * - Rejects requests where user has no companyId (except whitelisted onboarding routes)
 * - tenant_id is ALWAYS sourced from the authenticated user, NEVER from request body/params
 */
export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const companyId = req.user.companyId;

  if (!companyId) {
    res.status(403).json({ 
      message: 'No company associated with this account. Please complete onboarding.' 
    });
    return;
  }

  // Attach tenantId to request for use in controllers
  (req as any).tenantId = companyId;
  next();
};

/**
 * Optional Tenant Middleware — attaches tenantId if present, but doesn't reject if missing.
 * Used for endpoints that work both during and after onboarding.
 */
export const optionalTenant = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.companyId) {
    (req as any).tenantId = req.user.companyId;
  }
  next();
};
