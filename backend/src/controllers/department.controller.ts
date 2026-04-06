import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, color, userIds, managerId } = req.body;
    const newDept = await prisma.department.create({
      data: { name, description, color, managerId: managerId || null, companyId: req.user?.companyId || null }
    });

    const allUserIds = [...(userIds || [])];
    if (managerId && !allUserIds.includes(managerId)) {
      allUserIds.push(managerId);
    }

    if (allUserIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: allUserIds } },
        data: { departmentId: newDept.id }
      });
    }

    const department = await prisma.department.findUnique({
      where: { id: newDept.id },
      include: {
        manager: { select: { id: true, name: true, avatarColor: true } },
        _count: { select: { users: true, projects: true } }
      }
    });

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to create department', error });
  }
};

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      where: req.user?.companyId ? { companyId: req.user.companyId } : {},
      include: {
        manager: { select: { id: true, name: true, avatarColor: true } },
        _count: { select: { users: true, projects: true } }
      }
    });
    res.json({ departments });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to retrieve departments', error });
  }
};

export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, avatarColor: true } },
        users: {
          select: { id: true, name: true, email: true, avatarColor: true, designation: true }
        },
        projects: {
          select: { id: true, name: true, status: true, category: true }
        }
      }
    });

    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }
    res.json({ department });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to retrieve department', error });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, color, userIds, managerId } = req.body;
    
    await prisma.department.update({
      where: { id },
      data: { name, description, color, managerId: managerId || null }
    });

    // If manager is assigned, ensure they are in the department
    if (managerId) {
      await prisma.user.update({
        where: { id: managerId },
        data: { departmentId: id }
      });
    }

    if (userIds) {
      // First, remove everyone from this department
      await prisma.user.updateMany({
        where: { departmentId: id },
        data: { departmentId: null }
      });

      // Then add the new ones
      if (userIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { departmentId: id }
        });
      }
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, avatarColor: true } },
        _count: { select: { users: true, projects: true } }
      }
    });

    res.json({ message: 'Department updated successfully', department });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to update department', error });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Manually decouple users and projects to avoid strict Foreign Key constraint crashes
    await prisma.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
    await prisma.project.updateMany({ where: { departmentId: id }, data: { departmentId: null } });

    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to delete department', error });
  }
};

export const assignUsersToDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { userIds } = req.body as { userIds: string[] }; // Array of user IDs

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { departmentId: id }
    });
    
    res.json({ message: 'Users assigned to department successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to assign users', error });
  }
};
