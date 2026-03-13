import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

// GET /api/users — admin only
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/users/:id
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/users — admin only
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'user',
        avatarColor,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logActivity(req.user!.id, 'CREATED_USER', 'user', user.id, `Created user ${user.name}`);

    res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, email } = req.body;

    // Users can only update themselves, admins can update anyone
    if (req.user!.role !== 'admin' && req.user!.id !== id) {
      res.status(403).json({ message: 'Not allowed to update other users' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/users/:id/role — admin only
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ message: 'Role must be admin or user' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        isActive: true,
      },
    });

    await logActivity(req.user!.id, 'CHANGED_ROLE', 'user', user.id, `Changed ${user.name}'s role to ${role}`);

    res.json({ user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/users/:id/status — admin only
export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { isActive } = req.body;

    if (req.user!.id === id) {
      res.status(400).json({ message: 'Cannot deactivate your own account' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        isActive: true,
      },
    });

    await logActivity(
      req.user!.id,
      isActive ? 'ACTIVATED_USER' : 'DEACTIVATED_USER',
      'user',
      user.id,
      `${isActive ? 'Activated' : 'Deactivated'} user ${user.name}`
    );

    res.json({ user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
