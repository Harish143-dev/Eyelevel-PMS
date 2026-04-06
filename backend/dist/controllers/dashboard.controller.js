"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDashboard = exports.getAdminDashboard = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/dashboard/admin
const getAdminDashboard = async (req, res, next) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // TENANT ISOLATION: scope all queries to user's company
        const companyId = req.user.companyId;
        const tenantFilter = companyId ? { companyId } : {};
        const projectTenantFilter = companyId ? { companyId } : {};
        // Stats
        const [totalProjects, activeUsers, tasksThisMonth, completedTasks, pendingUsers] = await Promise.all([
            db_1.default.project.count({ where: { isArchived: false, isDeleted: false, ...projectTenantFilter } }),
            db_1.default.user.count({ where: { isActive: true, status: 'ACTIVE', ...tenantFilter } }),
            db_1.default.task.count({ where: { createdAt: { gte: firstDayOfMonth }, parentTaskId: null, isDeleted: false, ...(companyId ? { project: { companyId } } : {}) } }),
            db_1.default.task.count({ where: { status: 'completed', parentTaskId: null, isDeleted: false, ...(companyId ? { project: { companyId } } : {}) } }),
            db_1.default.user.count({ where: { status: 'PENDING', ...tenantFilter } }),
        ]);
        // Task status breakdown — scoped to tenant
        const taskCounts = await db_1.default.task.groupBy({
            by: ['status'],
            where: { parentTaskId: null, isDeleted: false, ...(companyId ? { project: { companyId } } : {}) },
            _count: { status: true },
        });
        const taskStatusBreakdown = {
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
        const projects = await db_1.default.project.findMany({
            where: { isArchived: false, isDeleted: false, ...projectTenantFilter },
            select: {
                id: true,
                name: true,
                status: true,
                category: true,
                _count: { select: { tasks: true } },
            },
        });
        const projectProgress = await Promise.all(projects.map(async (project) => {
            const completedCount = await db_1.default.task.count({
                where: { projectId: project.id, status: 'completed', parentTaskId: null, isDeleted: false },
            });
            const totalCount = await db_1.default.task.count({
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
        }));
        // Recent activity — scoped to tenant via user's company
        const recentActivity = await db_1.default.activityLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: companyId ? { user: { companyId } } : {},
            include: {
                user: { select: { id: true, name: true, avatarColor: true } },
            },
        });
        // Overdue tasks — scoped to tenant
        const overdueTasks = await db_1.default.task.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminDashboard = getAdminDashboard;
// GET /api/dashboard/user
const getUserDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        // Stats
        const [activeTasks, dueThisWeek, completedTotal] = await Promise.all([
            db_1.default.task.count({
                where: {
                    assignedTo: userId,
                    status: { notIn: ['completed', 'cancelled'] },
                    parentTaskId: null,
                    isDeleted: false,
                },
            }),
            db_1.default.task.count({
                where: {
                    assignedTo: userId,
                    dueDate: { gte: now, lte: nextWeek },
                    status: { notIn: ['completed', 'cancelled'] },
                    parentTaskId: null,
                    isDeleted: false,
                },
            }),
            db_1.default.task.count({
                where: { assignedTo: userId, status: 'completed', parentTaskId: null, isDeleted: false },
            }),
        ]);
        // My tasks grouped by status
        const myTasks = await db_1.default.task.findMany({
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
        const upcomingDeadlines = await db_1.default.task.findMany({
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
        const memberOf = await db_1.default.projectMember.findMany({
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
        const myProjects = await Promise.all(memberOf
            .filter((pm) => !pm.project.isArchived)
            .map(async (pm) => {
            const completedCount = await db_1.default.task.count({
                where: { projectId: pm.project.id, status: 'completed', parentTaskId: null, isDeleted: false },
            });
            const totalCount = await db_1.default.task.count({
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
        }));
        res.json({
            stats: { activeTasks, dueThisWeek, completedTotal },
            myTasks,
            upcomingDeadlines,
            myProjects,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserDashboard = getUserDashboard;
//# sourceMappingURL=dashboard.controller.js.map