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
export declare const requireTenant: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Optional Tenant Middleware — attaches tenantId if present, but doesn't reject if missing.
 * Used for endpoints that work both during and after onboarding.
 */
export declare const optionalTenant: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tenant.middleware.d.ts.map