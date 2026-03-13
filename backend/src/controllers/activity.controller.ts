import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/activity
export const getActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarColor: true } },
        },
      }),
      prisma.activityLog.count(),
    ]);

    res.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
