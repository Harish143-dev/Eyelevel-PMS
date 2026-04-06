import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from './auth.middleware';
import { DefaultRolePermissions } from '../config/permissions';

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
export const checkPermission = (...requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Super shortcut: legacy admin role always passes
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Try to resolve permissions from the Role model
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          roleId: true,
          role: true, // legacy role enum string
        },
      });

      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      let userPermissions: string[] = [];

      if (user.roleId) {
        // RBAC model: fetch permissions from the Role record
        const roleRecord = await prisma.role.findUnique({
          where: { id: user.roleId },
          select: { permissions: true },
        });

        if (roleRecord) {
          userPermissions = (roleRecord.permissions as string[]) || [];
        }
      }

      // Fallback: use legacy role default permissions if RBAC role has none
      if (userPermissions.length === 0 && user.role) {
        const legacyRole = String(user.role).toLowerCase();
        userPermissions = DefaultRolePermissions[legacyRole] || [];
      }

      // Check if user has at least ONE of the required permissions
      const hasPermission = requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        res.status(403).json({
          message: 'Forbidden: insufficient permissions',
          required: requiredPermissions,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
