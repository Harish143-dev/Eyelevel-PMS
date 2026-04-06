import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/dashboard/admin
export const getAdminDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // TENANT ISOLATION: scope all queries to user's company
    const companyId = req.user!.companyId;
    const tenantFilter = companyId ? { companyId } : {};
    const projectTenantFilter = companyId ? { companyId } : {};

    // Stats
    const [totalProjects, activeUsers, tasksThisMonth, completedTasks, pendingUsers] = await Promise.all([
      prisma.project.count({ where: { isArchived: false, isDeleted: false, ...projectTenantFilter } }),
      prisma.user.count({ where: { isActive: true, status: 'ACTIVE', ...tenantFilter } }),
      prisma.task.count({ where: { createdAt: { gte: firstDayOfMonth }, parentTaskId: null, isDeleted: false, ...(companyId ? { project: { companyId } } : {}) } }),
      prisma.task.count({ where: { status: 'completed', parentTaskId: null, isDeleted: false, ...(companyId ? { project: { companyId } } : {}) } }),
      prisma.user.count({ where: { status: 'PENDING', ...tenantFilter } }),
    ]);

    // Task status breakdown — scoped to tenant
    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { parentTaskId: null, isDeleted: false, ...(companyId ? { project: { companyId } } : {}) },
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

    // Project progress — scoped to tenant
    const projects = await prisma.project.findMany({
      where: { isArchived: false, isDeleted: false, ...projectTenantFilter },
      select: {
        id: true,
        name: true,
        status: true,
        category: true,
        _count: { select: { tasks: true } },
      },
    });

    const projectProgress = await Promise.all(
      projects.map(async (project) => {
        const completedCount = await prisma.task.count({
          where: { projectId: project.id, status: 'completed', parentTaskId: null, isDeleted: false },
        });
        const totalCount = await prisma.task.count({
          where: { projectId: project.id, parentTaskId: null, isDeleted: false },
        });
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          category: project.category,
          totalTasks: totalCount,
          completedTasks: completedCount,
          progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        };
      })
    );

    // Recent activity — scoped to tenant via user's company
    const recentActivity = await prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: companyId ? { user: { companyId } } : {},
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    // Overdue tasks — scoped to tenant
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['completed', 'cancelled'] },
        parentTaskId: null,
        isDeleted: false,
        ...(companyId ? { project: { companyId } } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    res.json({
      stats: { totalProjects, activeUsers, tasksThisMonth, completedTasks, pendingUsers },
      taskStatusBreakdown,
      projectProgress,
      recentActivity,
      overdueTasks,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/user
export const getUserDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
          parentTaskId: null,
          isDeleted: false,
        },
      }),
      prisma.task.count({
        where: {
          assignedTo: userId,
          dueDate: { gte: now, lte: nextWeek },
          status: { notIn: ['completed', 'cancelled'] },
          parentTaskId: null,
          isDeleted: false,
        },
      }),
      prisma.task.count({
        where: { assignedTo: userId, status: 'completed', parentTaskId: null, isDeleted: false },
      }),
    ]);

    // My tasks grouped by status
    const myTasks = await prisma.task.findMany({
      where: {
        assignedTo: userId,
        status: { notIn: ['completed', 'cancelled'] },
        parentTaskId: null,
        isDeleted: false,
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
        parentTaskId: null,
        isDeleted: false,
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
      memberOf
        .filter((pm) => !pm.project.isArchived)
        .map(async (pm) => {
          const completedCount = await prisma.task.count({
            where: { projectId: pm.project.id, status: 'completed', parentTaskId: null, isDeleted: false },
          });
          const totalCount = await prisma.task.count({
            where: { projectId: pm.project.id, parentTaskId: null, isDeleted: false },
          });
          return {
            id: pm.project.id,
            name: pm.project.name,
            status: pm.project.status,
            owner: pm.project.owner,
            totalTasks: totalCount,
            completedTasks: completedCount,
            progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
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
    next(error);
  }
};
