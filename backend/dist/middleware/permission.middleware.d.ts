import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware to check if the authenticated user has a specific permission.
 *
 * Permissions are resolved from:
 * 1. The user's assigned Role record (if they have a roleId pointing to the Role model)
 * 2. Fallback: legacy role string ('admin', 'manager', etc.) mapped to default permissions
 *
 * Admins always pass — the admin role has all permissions by default.
 *
 * Usage: router.post('/projects', verifyJWT, checkPermission('project:create'), createProject);
 */
export declare const checkPermission: (...requiredPermissions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=permission.middleware.d.ts.map