"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportExport = exports.getProjectCost = exports.getTeamComparison = exports.getSystemStats = exports.getProductivityHeatmap = exports.getGlobalWorkload = exports.getProjectBurndown = exports.getProjectWorkload = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/analytics/projects/:projectId/workload
const getProjectWorkload = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        // Authorization check - user must be in project
        const member = await db_1.default.projectMember.findFirst({
            where: { projectId, userId: req.user.id }
        });
        if (!member && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const tasks = await db_1.default.task.findMany({
            where: { projectId, isDeleted: false },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        // Calculate workload per user
        const workloadMap = {};
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
            }
            else {
                workloadMap[assigneeKey].pending++;
            }
        });
        const workload = Object.values(workloadMap).filter(w => w.total > 0);
        res.json({ workload });
    }
    catch (error) {
        console.error('Workload analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjectWorkload = getProjectWorkload;
// GET /api/analytics/projects/:projectId/burndown
const getProjectBurndown = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const member = await db_1.default.projectMember.findFirst({
            where: { projectId, userId: req.user.id }
        });
        if (!member && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const tasks = await db_1.default.task.findMany({
            where: { projectId, isDeleted: false },
            select: { createdAt: true, status: true, updatedAt: true }
        });
        // Simple burndown (grouping tasks by creation date and completion date)
        const datesMap = {};
        tasks.forEach(task => {
            const createdDate = task.createdAt.toISOString().split('T')[0];
            if (!datesMap[createdDate])
                datesMap[createdDate] = { date: createdDate, created: 0, completed: 0 };
            datesMap[createdDate].created++;
            if (task.status === 'completed') {
                const completedDate = task.updatedAt.toISOString().split('T')[0];
                if (!datesMap[completedDate])
                    datesMap[completedDate] = { date: completedDate, created: 0, completed: 0 };
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
    }
    catch (error) {
        console.error('Burndown analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjectBurndown = getProjectBurndown;
// GET /api/analytics/workload
const getGlobalWorkload = async (req, res) => {
    try {
        // Only admins or people with manager capabilities can see this.
        // Assuming managers are just users in this context, but let's restrict to authenticated users.
        // Fetch all pending/ongoing tasks grouped by assignee
        const tasks = await db_1.default.task.findMany({
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
        const workloadMap = {};
        tasks.forEach(task => {
            const assigneeKey = task.assignee.id;
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
    }
    catch (error) {
        console.error('Global workload error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getGlobalWorkload = getGlobalWorkload;
// GET /api/analytics/productivity-heatmap
const getProductivityHeatmap = async (req, res) => {
    try {
        const userId = req.query.userId || req.user.id;
        // Authorization check
        if (userId !== req.user.id && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const timeLogs = await db_1.default.timeLog.findMany({
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
        const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));
        timeLogs.forEach(log => {
            const date = new Date(log.startTime);
            const day = date.getDay(); // 0-6
            const hour = date.getHours(); // 0-23
            const durationHours = (log.duration || 0) / 3600;
            heatmap[day][hour] += parseFloat(durationHours.toFixed(2));
        });
        res.json({ heatmap });
    }
    catch (error) {
        console.error('Heatmap analytics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProductivityHeatmap = getProductivityHeatmap;
// GET /api/analytics/system-stats
const getSystemStats = async (req, res) => {
    try {
        if (!['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const [userCount, projectCount, taskCount, totalTime] = await Promise.all([
            db_1.default.user.count(),
            db_1.default.project.count({ where: { isArchived: false } }),
            db_1.default.task.count(),
            db_1.default.timeLog.aggregate({ _sum: { duration: true } })
        ]);
        res.json({
            stats: {
                totalUsers: userCount,
                activeProjects: projectCount,
                totalTasks: taskCount,
                totalHoursTracked: Math.floor((totalTime._sum.duration || 0) / 3600)
            }
        });
    }
    catch (error) {
        console.error('System stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getSystemStats = getSystemStats;
// GET /api/analytics/team-comparison
const getTeamComparison = async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        // Get all active users with their task stats
        const users = await db_1.default.user.findMany({
            where: { isActive: true, status: 'ACTIVE' },
            select: { id: true, name: true, avatarColor: true, designation: true, department: { select: { name: true } } },
        });
        const comparison = await Promise.all(users.map(async (user) => {
            const [tasksCompleted, tasksCreated, totalTimeLogged] = await Promise.all([
                db_1.default.task.count({
                    where: {
                        assignedTo: user.id,
                        status: 'completed',
                        isDeleted: false,
                        updatedAt: { gte: startDate, lte: endDate },
                    },
                }),
                db_1.default.task.count({
                    where: {
                        createdBy: user.id,
                        isDeleted: false,
                        createdAt: { gte: startDate, lte: endDate },
                    },
                }),
                db_1.default.timeLog.aggregate({
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
        }));
        // Sort by tasks completed descending
        comparison.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
        res.json({ comparison, startDate, endDate });
    }
    catch (error) {
        console.error('Team comparison error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTeamComparison = getTeamComparison;
// GET /api/analytics/project-cost?projectId=xxx&hourlyRate=50
const getProjectCost = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const hourlyRate = parseFloat(req.query.hourlyRate) || 50;
        if (!projectId) {
            res.status(400).json({ message: 'projectId is required' });
            return;
        }
        // Auth check
        const member = await db_1.default.projectMember.findFirst({
            where: { projectId, userId: req.user.id },
        });
        if (!member && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const project = await db_1.default.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, startDate: true, deadline: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        // Get time logs grouped by user
        const timeLogs = await db_1.default.timeLog.findMany({
            where: { task: { projectId, isDeleted: false } },
            include: {
                user: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } },
            },
        });
        // Aggregate by user
        const userCosts = {};
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
    }
    catch (error) {
        console.error('Project cost error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjectCost = getProjectCost;
// GET /api/analytics/report-export?projectId=xxx — comprehensive data for PDF export
const getReportExport = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        if (!projectId) {
            res.status(400).json({ message: 'projectId is required' });
            return;
        }
        // Auth check
        const member = await db_1.default.projectMember.findFirst({
            where: { projectId, userId: req.user.id },
        });
        if (!member && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const project = await db_1.default.project.findUnique({
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
        const taskWhere = { projectId, isDeleted: false };
        if (startDate || endDate) {
            taskWhere.createdAt = {};
            if (startDate)
                taskWhere.createdAt.gte = startDate;
            if (endDate)
                taskWhere.createdAt.lte = endDate;
        }
        const [tasks, milestones, timeLogs] = await Promise.all([
            db_1.default.task.findMany({
                where: taskWhere,
                include: {
                    assignee: { select: { name: true } },
                    creator: { select: { name: true } },
                },
                orderBy: { createdAt: 'asc' },
            }),
            db_1.default.milestone.findMany({
                where: { projectId },
                orderBy: { position: 'asc' },
            }),
            db_1.default.timeLog.findMany({
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
        const statusBreakdown = {};
        tasks.forEach((t) => {
            statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
        });
        // Priority breakdown
        const priorityBreakdown = {};
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
    }
    catch (error) {
        console.error('Report export error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getReportExport = getReportExport;
//# sourceMappingURL=analytics.controller.js.map