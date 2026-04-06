import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '../config/roles';

// GET /api/search?q=query
export const searchAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.json({ projects: [], tasks: [] });
      return;
    }

    const isUser = req.user!.role === Role.EMPLOYEE;
    const memberCondition = isUser ? { members: { some: { userId: req.user!.id } } } : {};

    // Search Projects
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          memberCondition
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
      },
      take: 5,
    });

    // Search Tasks (only parent tasks)
    const tasks = await prisma.task.findMany({
      where: {
        parentTaskId: null,
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          isUser ? { project: { members: { some: { userId: req.user!.id } } } } : {}
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        projectId: true,
        project: { select: { name: true } },
      },
      take: 5,
    });

    res.json({ projects, tasks });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
