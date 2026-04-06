import { Request, Response, NextFunction } from 'express';
/**
 * GET /api/tenant/resolve
 * Resolves a tenant by either hostname (custom domain) or subdomain (slug).
 */
export declare const resolveTenantBranding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=tenant.controller.d.ts.map