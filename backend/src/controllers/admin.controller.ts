import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

// GET /api/admin/pending-users
export const getPendingUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/pending-count
export const getPendingCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await prisma.user.count({ where: { status: 'PENDING' } });
    res.json({ count });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/admin/users/:id/approve
export const approveUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const target = await prisma.user.findUnique({ where: { id: id as string } });
    if (!target) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (target.status !== 'PENDING') {
      res.status(400).json({ message: 'User is not in pending status' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: id as string },
      data: { status: 'ACTIVE', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logActivity(req.user!.id, 'APPROVED_USER', 'employee', user.id, `Approved user ${user.name}`);

    res.json({ user, message: 'User approved successfully' });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/admin/users/:id/reject
export const rejectUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const target = await prisma.user.findUnique({ where: { id: id as string } });
    if (!target) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (target.status !== 'PENDING') {
      res.status(400).json({ message: 'User is not in pending status' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: id as string },
      data: { status: 'REJECTED', isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logActivity(req.user!.id, 'REJECTED_USER', 'employee', user.id, `Rejected user ${user.name}`);

    res.json({ user, message: 'User rejected' });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/admin/users/:id/deactivate
export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user!.id === id) {
      res.status(400).json({ message: 'Cannot deactivate your own account' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: id as string },
      data: { status: 'INACTIVE', isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logActivity(req.user!.id, 'DEACTIVATED_USER', 'employee', user.id, `Deactivated user ${user.name}`);

    res.json({ user, message: 'User deactivated' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
