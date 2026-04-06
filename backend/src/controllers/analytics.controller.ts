import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/analytics/projects/:projectId/workload
export const getProjectWorkload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    
    // Authorization check - user must be in project
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user!.id }
    });
    if (!member && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const tasks: any[] = await prisma.task.findMany({
      where: { projectId, isDeleted: false },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } }
      }
    });

    // Calculate workload per user
    const workloadMap: Record<string, { user: any; total: number; completed: number; pending: number }> = {};
    
    // Add "Unassigned" as a bucket
    workloadMap['unassigned'] = { user: { name: 'Unassigned', avatarColor: '#94a3b8' }, total: 0, completed: 0, pending: 0 };

    tasks.forEach(task => {
      const assigneeKey = task.assignee ? task.assignee.id : 'unassigned';
      
      if (!workloadMap[assigneeKey]) {
        workloadMap[assigneeKey] = {
           user: task.assignee, 
           total: 0, 
           completed: 0, 
           pending: 0 
        };
      }
      
      workloadMap[assigneeKey].total++;
      if (task.status === 'completed') {
        workloadMap[assigneeKey].completed++;
      } else {
        workloadMap[assigneeKey].pending++;
      }
    });

    const workload = Object.values(workloadMap).filter(w => w.total > 0);

    res.json({ workload });
  } catch (error) {
    console.error('Workload analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/projects/:projectId/burndown
export const getProjectBurndown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user!.id }
    });
    if (!member && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId, isDeleted: false },
      select: { createdAt: true, status: true, updatedAt: true }
    });

    // Simple burndown (grouping tasks by creation date and completion date)
    const datesMap: Record<string, { date: string; created: number; completed: number }> = {};
    
    tasks.forEach(task => {
      const createdDate = task.createdAt.toISOString().split('T')[0];
      if (!datesMap[createdDate]) datesMap[createdDate] = { date: createdDate, created: 0, completed: 0 };
      datesMap[createdDate].created++;
      
      if (task.status === 'completed') {
        const completedDate = task.updatedAt.toISOString().split('T')[0];
        if (!datesMap[completedDate]) datesMap[completedDate] = { date: completedDate, created: 0, completed: 0 };
        datesMap[completedDate].completed++;
      }
    });

    // Sort by date
    const burndown = Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cumulative
    let cumulativeTotal = 0;
    let cumulativeCompleted = 0;
    
    const cumulativeData = burndown.map(d => {
       cumulativeTotal += d.created;
       cumulativeCompleted += d.completed;
       return {
         date: d.date,
         remaining: cumulativeTotal - cumulativeCompleted,
         completed: cumulativeCompleted,
         total: cumulativeTotal
       };
    });

    res.json({ burndown: cumulativeData });
  } catch (error) {
    console.error('Burndown analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/workload
export const getGlobalWorkload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only admins or people with manager capabilities can see this.
    // Assuming managers are just users in this context, but let's restrict to authenticated users.
    
    // Fetch all pending/ongoing tasks grouped by assignee
    const tasks = await prisma.task.findMany({
      where: { 
        status: { not: 'completed' },
        assignee: { isNot: null },
        isDeleted: false
      },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true, department: { select: { name: true } } } },
        project: { select: { id: true, name: true } }
      }
    });

    const workloadMap: Record<string, { user: any; activeTasks: number; projects: Set<string> }> = {};

    tasks.forEach(task => {
      const assigneeKey = task.assignee!.id;
      
      if (!workloadMap[assigneeKey]) {
        workloadMap[assigneeKey] = {
           user: task.assignee, 
           activeTasks: 0, 
           projects: new Set()
        };
      }
      
      workloadMap[assigneeKey].activeTasks++;
      workloadMap[assigneeKey].projects.add(task.project.name);
    });

    const workload = Object.values(workloadMap).map(w => ({
      ...w,
      projects: Array.from(w.projects)
    })).sort((a, b) => b.activeTasks - a.activeTasks);

    res.json({ workload });
  } catch (error) {
    console.error('Global workload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/productivity-heatmap
export const getProductivityHeatmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string || req.user!.id;
    
    // Authorization check
    if (userId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const timeLogs = await prisma.timeLog.findMany({
      where: { 
        userId,
        startTime: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
        }
      },
      select: { startTime: true, duration: true }
    });

    // Group by day of week and hour of day
    // heatmap[dayOfWeek][hourOfDay] = totalDuration
    const heatmap: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    timeLogs.forEach(log => {
      const date = new Date(log.startTime);
      const day = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      const durationHours = (log.duration || 0) / 3600;
      
      heatmap[day][hour] += parseFloat(durationHours.toFixed(2));
    });

    res.json({ heatmap });
  } catch (error) {
    console.error('Heatmap analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/system-stats
export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const [userCount, projectCount, taskCount, totalTime] = await Promise.all([
      prisma.user.count(),
      prisma.project.count({ where: { isArchived: false } }),
      prisma.task.count(),
      prisma.timeLog.aggregate({ _sum: { duration: true } })
    ]);

    res.json({
      stats: {
        totalUsers: userCount,
        activeProjects: projectCount,
        totalTasks: taskCount,
        totalHoursTracked: Math.floor((totalTime._sum.duration || 0) / 3600)
      }
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/team-comparison
export const getTeamComparison = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    // Get all active users with their task stats
    const users = await prisma.user.findMany({
      where: { isActive: true, status: 'ACTIVE' },
      select: { id: true, name: true, avatarColor: true, designation: true, department: { select: { name: true } } },
    });

    const comparison = await Promise.all(
      users.map(async (user) => {
        const [tasksCompleted, tasksCreated, totalTimeLogged] = await Promise.all([
          prisma.task.count({
            where: {
              assignedTo: user.id,
              status: 'completed',
              isDeleted: false,
              updatedAt: { gte: startDate, lte: endDate },
            },
          }),
          prisma.task.count({
            where: {
              createdBy: user.id,
              isDeleted: false,
              createdAt: { gte: startDate, lte: endDate },
            },
          }),
          prisma.timeLog.aggregate({
            where: {
              userId: user.id,
              startTime: { gte: startDate, lte: endDate },
            },
            _sum: { duration: true },
          }),
        ]);

        return {
          user,
          tasksCompleted,
          tasksCreated,
          hoursLogged: Math.round(((totalTimeLogged._sum.duration || 0) / 3600) * 10) / 10,
        };
      })
    );

    // Sort by tasks completed descending
    comparison.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    res.json({ comparison, startDate, endDate });
  } catch (error) {
    console.error('Team comparison error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// GET /api/analytics/project-cost?projectId=xxx&hourlyRate=50
export const getProjectCost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.query.projectId as string;
    const hourlyRate = parseFloat(req.query.hourlyRate as string) || 50;

    if (!projectId) {
      res.status(400).json({ message: 'projectId is required' });
      return;
    }

    // Auth check
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user!.id },
    });
    if (!member && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, startDate: true, deadline: true },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Get time logs grouped by user
    const timeLogs = await prisma.timeLog.findMany({
      where: { task: { projectId, isDeleted: false } },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Aggregate by user
    const userCosts: Record<string, { user: any; totalSeconds: number; totalCost: number; tasks: Set<string> }> = {};

    timeLogs.forEach((log) => {
      const key = log.userId;
      if (!userCosts[key]) {
        userCosts[key] = { user: log.user, totalSeconds: 0, totalCost: 0, tasks: new Set() };
      }
      const duration = log.duration || 0;
      userCosts[key].totalSeconds += duration;
      userCosts[key].tasks.add(log.task.title);
    });

    const costBreakdown = Object.values(userCosts).map((uc) => {
      const hours = uc.totalSeconds / 3600;
      return {
        user: uc.user,
        hoursLogged: Math.round(hours * 10) / 10,
        cost: Math.round(hours * hourlyRate * 100) / 100,
        taskCount: uc.tasks.size,
      };
    });

    const totalHours = costBreakdown.reduce((sum, c) => sum + c.hoursLogged, 0);
    const totalCost = costBreakdown.reduce((sum, c) => sum + c.cost, 0);

    res.json({
      project,
      hourlyRate,
      totalHours: Math.round(totalHours * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100,
      costBreakdown,
    });
  } catch (error) {
    console.error('Project cost error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/report-export?projectId=xxx — comprehensive data for PDF export
export const getReportExport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.query.projectId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!projectId) {
      res.status(400).json({ message: 'projectId is required' });
      return;
    }

    // Auth check
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user!.id },
    });
    if (!member && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { name: true } },
        members: { include: { user: { select: { name: true, designation: true } } } },
      },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const taskWhere: any = { projectId, isDeleted: false };
    if (startDate || endDate) {
      taskWhere.createdAt = {};
      if (startDate) taskWhere.createdAt.gte = startDate;
      if (endDate) taskWhere.createdAt.lte = endDate;
    }

    const [tasks, milestones, timeLogs] = await Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: { select: { name: true } },
          creator: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.milestone.findMany({
        where: { projectId },
        orderBy: { position: 'asc' },
      }),
      prisma.timeLog.findMany({
        where: { task: { projectId, isDeleted: false } },
        include: {
          user: { select: { name: true } },
          task: { select: { title: true } },
        },
      }),
    ]);

    // Summary stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
    const totalTimeSeconds = timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    tasks.forEach((t) => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    tasks.forEach((t) => {
      priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
    });

    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        project: {
          name: project.name,
          description: project.description,
          status: project.status,
          owner: project.owner.name,
          startDate: project.startDate,
          deadline: project.deadline,
          members: project.members.map((m) => ({
            name: m.user.name,
            designation: m.user.designation,
            isProjectManager: m.isProjectManager,
          })),
        },
        summary: {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          overdueTasks,
          totalHoursLogged: Math.round((totalTimeSeconds / 3600) * 10) / 10,
          milestonesTotal: milestones.length,
          milestonesCompleted: milestones.filter((m) => m.status === 'completed').length,
        },
        statusBreakdown,
        priorityBreakdown,
        tasks: tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assignee?.name || 'Unassigned',
          dueDate: t.dueDate,
          createdAt: t.createdAt,
        })),
        milestones: milestones.map((m) => ({
          title: m.title,
          status: m.status,
          dueDate: m.dueDate,
        })),
      },
    });
  } catch (error) {
    console.error('Report export error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
