import { Response } from 'express';
const prisma: any = require('../config/db').default;
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

// POST /api/time/start
export const startTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, description } = req.body;
    const userId = req.user!.id;

    if (!taskId) {
      res.status(400).json({ message: 'Task ID is required' });
      return;
    }

    // Check if there's already a running timer for this user
    const runningTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (runningTimer) {
      res.status(400).json({ message: 'You already have a running timer. Stop it first.' });
      return;
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        userId,
        startTime: new Date(),
        description,
      },
      include: {
        task: { select: { title: true } },
      },
    });

    res.status(201).json({ timeLog });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/time/stop
export const stopTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const runningTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (!runningTimer) {
      res.status(404).json({ message: 'No running timer found' });
      return;
    }

    const endTime = new Date();
    const durationCount = Math.floor((endTime.getTime() - runningTimer.startTime.getTime()) / 1000); // duration in seconds

    const timeLog = await prisma.timeLog.update({
      where: { id: runningTimer.id },
      data: {
        endTime,
        duration: durationCount,
      },
      include: {
        task: { select: { title: true } },
      },
    });

    res.json({ timeLog });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/time/log
export const logTimeManual = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, startTime, endTime, duration, description } = req.body;
    const userId = req.user!.id;

    if (!taskId || !duration) {
      res.status(400).json({ message: 'Task ID and duration are required' });
      return;
    }

    const logStartTime = startTime ? new Date(startTime) : new Date();
    const logEndTime = endTime ? new Date(endTime) : new Date();

    // Check for overlapping logs
    const overlap = await prisma.timeLog.findFirst({
      where: {
        userId,
        OR: [
          {
            startTime: { lte: logStartTime },
            endTime: { gte: logStartTime }
          },
          {
            startTime: { lte: logEndTime },
            endTime: { gte: logEndTime }
          }
        ]
      }
    });

    if (overlap) {
      res.status(400).json({ message: 'This time range overlaps with an existing log.' });
      return;
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        userId,
        startTime: logStartTime,
        endTime: logEndTime,
        duration: parseInt(duration), // seconds
        description,
      },
      include: {
        task: { select: { title: true } },
      },
    });

    res.status(201).json({ timeLog });
  } catch (error) {
    console.error('Log time error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/time/logs
export const getTimeLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, projectId, startDate, endDate } = req.query;
    const userId = req.user!.id;

    const where: any = {};

    // Admins can see all logs if they query, otherwise users see their own
    if (req.user!.role !== 'admin' && req.user!.role !== 'manager') {
      where.userId = userId;
    } else if (req.query.userId) {
      where.userId = req.query.userId as string;
    }

    if (taskId) where.taskId = taskId as string;
    if (projectId) {
      where.task = { projectId: projectId as string };
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate as string);
      if (endDate) where.startTime.lte = new Date(endDate as string);
    }

    const logs = await prisma.timeLog.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } }
          }
        },
        user: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/time/running
export const getRunningTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const runningTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        task: { select: { id: true, title: true } },
      },
    });

    res.json({ runningTimer });
  } catch (error) {
    console.error('Get running timer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/time/logs/:id
export const deleteTimeLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const log = await prisma.timeLog.findUnique({ where: { id } });
    if (!log) {
      res.status(404).json({ message: 'Log not found' });
      return;
    }

    if (log.userId !== userId && req.user!.role !== 'manager' && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    await prisma.timeLog.delete({ where: { id } });
    res.json({ message: 'Time log deleted' });
  } catch (error) {
    console.error('Delete time log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
