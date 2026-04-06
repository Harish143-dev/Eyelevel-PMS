import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { DefaultRolePermissions } from '../config/permissions';
import { logActivity } from '../services/activity.service';

/**
 * GET /api/roles
 * Lists all roles for the user's company.
 */
export const getRoles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    const where: any = {};
    if (user?.companyId) {
      // Show company-specific roles + global system roles
      where.OR = [
        { companyId: user.companyId },
        { companyId: null, isSystemRole: true },
      ];
    } else {
      where.isSystemRole = true;
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        _count: { select: { users: true } },
      },
      orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
    });

    // Also fetch users in the company to map legacy string-enum roles correctly to system roles
    const usersInCompany = await prisma.user.findMany({
      where: user?.companyId ? { companyId: user.companyId } : {},
      select: { role: true, roleId: true }
    });

    const mappedRoles = roles.map((r: any) => {
      const dbCount = r._count?.users || 0;
      let stringMatchCount = 0;
      if (r.isSystemRole) {
        // Case-insensitive match for enum vs name (e.g. 'admin' vs 'Admin')
        stringMatchCount = usersInCompany.filter(u => 
          u.role.toLowerCase() === r.name.toLowerCase() && !u.roleId
        ).length;
      }
      return {
        ...r,
        _count: { users: dbCount + stringMatchCount }
      };
    });

    res.json({ roles: mappedRoles });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roles/:id
 * Get a single role by ID.
 */
export const getRoleById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id: id as string },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!role) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    let stringMatchCount = 0;
    if (role.isSystemRole) {
       // Manual count for users with matching enum but no roleId
       const users = await prisma.user.findMany({
         where: { companyId: role.companyId, roleId: null }
       });
       stringMatchCount = users.filter(u => 
         u.role.toLowerCase() === role.name.toLowerCase()
       ).length;
    }

    const mappedRole = {
      ...role,
      _count: { users: (role._count?.users || 0) + stringMatchCount }
    };

    res.json({ role: mappedRole });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roles
 * Create a new custom role.
 * Body: { name, permissions }
 */
export const createRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, permissions } = req.body;

    if (!name || name.trim().length < 2) {
      res.status(400).json({ message: 'Role name is required (min 2 characters)' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(400).json({ message: 'No company found. Complete onboarding first.' });
      return;
    }

    // Check for duplicate name within the company
    const existing = await prisma.role.findFirst({
      where: { companyId: user.companyId, name: { equals: name.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      res.status(409).json({ message: 'A role with this name already exists' });
      return;
    }

    const role = await prisma.role.create({
      data: {
        companyId: user.companyId,
        name: name.trim(),
        permissions: Array.isArray(permissions) ? permissions : [],
        isSystemRole: false,
      },
      include: {
        _count: { select: { users: true } },
      },
    });

    await logActivity(req.user!.id, 'ROLE_CREATED', 'role', role.id, `Created role "${role.name}"`);

    res.status(201).json({ role, message: 'Role created successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/roles/:id
 * Update a role's name and/or permissions.
 * Body: { name?, permissions? }
 */
export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const existing = await prisma.role.findUnique({ where: { id: id as string } });
    if (!existing) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    // System roles can have permissions updated, but not renamed
    if (existing.isSystemRole && name && name !== existing.name) {
      res.status(400).json({ message: 'System roles cannot be renamed' });
      return;
    }

    const data: any = {};
    if (name) data.name = name.trim();
    if (Array.isArray(permissions)) data.permissions = permissions;

    const role = await prisma.role.update({
      where: { id: id as string },
      data,
      include: {
        _count: { select: { users: true } },
      },
    });

    await logActivity(req.user!.id, 'ROLE_UPDATED', 'role', role.id, `Updated role "${role.name}"`);

    res.json({ role, message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/roles/:id
 * Delete a custom role. System roles cannot be deleted.
 */
export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.role.findUnique({
      where: { id: id as string },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      res.status(404).json({ message: 'Role not found' });
      return;
    }

    if (existing.isSystemRole) {
      res.status(400).json({ message: 'System roles cannot be deleted' });
      return;
    }

    if (existing._count.users > 0) {
      res.status(400).json({
        message: `Cannot delete role "${existing.name}" — it is assigned to ${existing._count.users} user(s). Reassign them first.`,
      });
      return;
    }

    await prisma.role.delete({ where: { id: id as string } });

    await logActivity(req.user!.id, 'ROLE_DELETED', 'role', id as string, `Deleted role "${existing.name}"`);

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};
