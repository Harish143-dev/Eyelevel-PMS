import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/dashboard/admin
export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stats
    const [totalProjects, activeUsers, tasksThisMonth, completedTasks] = await Promise.all([
      prisma.project.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.task.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.task.count({ where: { status: 'completed' } }),
    ]);

    // Task status breakdown
    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const taskStatusBreakdown: Record<string, number> = {
      pending: 0,
      ongoing: 0,
      in_review: 0,
      completed: 0,
      cancelled: 0,
    };
    taskCounts.forEach((tc) => {
      taskStatusBreakdown[tc.status] = tc._count.status;
    });

    // Project progress
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: { select: { tasks: true } },
      },
    });

    const projectProgress = await Promise.all(
      projects.map(async (project) => {
        const completedCount = await prisma.task.count({
          where: { projectId: project.id, status: 'completed' },
        });
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          totalTasks: project._count.tasks,
          completedTasks: completedCount,
          progress: project._count.tasks > 0 ? Math.round((completedCount / project._count.tasks) * 100) : 0,
        };
      })
    );

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    // Overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    res.json({
      stats: { totalProjects, activeUsers, tasksThisMonth, completedTasks },
      taskStatusBreakdown,
      projectProgress,
      recentActivity,
      overdueTasks,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/dashboard/user
export const getUserDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Stats
    const [activeTasks, dueThisWeek, completedTotal] = await Promise.all([
      prisma.task.count({
        where: {
          assignedTo: userId,
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
      prisma.task.count({
        where: {
          assignedTo: userId,
          dueDate: { gte: now, lte: nextWeek },
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
      prisma.task.count({
        where: { assignedTo: userId, status: 'completed' },
      }),
    ]);

    // My tasks grouped by status
    const myTasks = await prisma.task.findMany({
      where: {
        assignedTo: userId,
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    // Upcoming deadlines
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        assignedTo: userId,
        dueDate: { gte: now },
        status: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // My projects with progress
    const memberOf = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, avatarColor: true } },
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    const myProjects = await Promise.all(
      memberOf.map(async (pm) => {
        const completedCount = await prisma.task.count({
          where: { projectId: pm.project.id, status: 'completed' },
        });
        return {
          id: pm.project.id,
          name: pm.project.name,
          status: pm.project.status,
          owner: pm.project.owner,
          totalTasks: pm.project._count.tasks,
          completedTasks: completedCount,
          progress: pm.project._count.tasks > 0 ? Math.round((completedCount / pm.project._count.tasks) * 100) : 0,
        };
      })
    );

    res.json({
      stats: { activeTasks, dueThisWeek, completedTotal },
      myTasks,
      upcomingDeadlines,
      myProjects,
    });
  } catch (error) {
    console.error('User dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
