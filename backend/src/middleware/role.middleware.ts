import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Role } from '../config/roles';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
};

// Convenience helpers using centralized Roles
export const requireManager = requireRole(Role.ADMIN, Role.MANAGER);
export const requireAdmin = requireRole(Role.ADMIN);
export const requireHR = requireRole(Role.ADMIN, Role.HR);
export const requireStaff = requireRole(Role.ADMIN, Role.MANAGER, Role.HR);
