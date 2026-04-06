"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const db_1 = __importDefault(require("../config/db"));
const roles_1 = require("../config/roles");
class ProjectService {
    /**
     * Complex logic to determine who becomes the Project Manager and which department defaults apply.
     */
    static async resolveProjectMembers(creatorId, providedMemberIds, projectManagerId, departmentId, otherDepartmentIds) {
        const allMemberIdsSet = new Set(providedMemberIds || []);
        let finalProjectManagerId = projectManagerId || creatorId;
        let primaryDeptManagerId = null;
        if (departmentId) {
            const primaryDept = await db_1.default.department.findUnique({
                where: { id: departmentId },
                include: { users: { select: { id: true } } }
            });
            if (primaryDept) {
                primaryDept.users.forEach(u => allMemberIdsSet.add(u.id));
                primaryDeptManagerId = primaryDept.managerId;
            }
        }
        if (otherDepartmentIds && otherDepartmentIds.length > 0) {
            const otherDeptsUsers = await db_1.default.user.findMany({
                where: { departmentId: { in: otherDepartmentIds }, status: 'ACTIVE' },
                select: { id: true }
            });
            otherDeptsUsers.forEach(u => allMemberIdsSet.add(u.id));
        }
        if (!projectManagerId && primaryDeptManagerId) {
            finalProjectManagerId = primaryDeptManagerId;
        }
        allMemberIdsSet.add(creatorId);
        allMemberIdsSet.add(finalProjectManagerId);
        return {
            finalMemberIds: Array.from(allMemberIdsSet),
            finalProjectManagerId
        };
    }
    /**
     * Retrieves paginated, aggregated project lists with isolation.
     */
    static async getPaginatedProjects(filterParams, user, paginationParams) {
        const where = { isDeleted: false };
        if (user.companyId)
            where.companyId = user.companyId;
        where.isArchived = filterParams.showArchived;
        if (filterParams.category)
            where.category = filterParams.category;
        if (filterParams.status)
            where.status = filterParams.status;
        if (filterParams.search)
            where.name = { contains: filterParams.search, mode: 'insensitive' };
        if (filterParams.managerId)
            where.ownerId = filterParams.managerId;
        if (filterParams.deadline) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (filterParams.deadline === 'today') {
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                where.deadline = { gte: now, lt: tomorrow };
            }
            else if (filterParams.deadline === 'this-week') {
                const endOfWeek = new Date(now);
                endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
                where.deadline = { gte: now, lte: endOfWeek };
            }
            else if (filterParams.deadline === 'overdue') {
                where.deadline = { lt: now };
                where.status = { not: 'completed' };
            }
        }
        const isPrivileged = roles_1.RoleGroups.STAFF.includes(user.role);
        if (!isPrivileged) {
            where.members = { some: { userId: user.id } };
        }
        const [projects, total] = await Promise.all([
            db_1.default.project.findMany({
                where,
                include: {
                    owner: { select: { id: true, name: true, avatarColor: true } },
                    members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
                    _count: { select: { tasks: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: paginationParams.skip,
                take: paginationParams.take,
            }),
            db_1.default.project.count({ where }),
        ]);
        // Fast metric lookup without N+1 logic
        const projectIds = projects.map((p) => p.id);
        const taskCounts = await db_1.default.task.groupBy({
            by: ['projectId', 'status'],
            where: { projectId: { in: projectIds }, parentTaskId: null, isDeleted: false },
            _count: { id: true },
        });
        const taskCountMap = {};
        for (const row of taskCounts) {
            if (!taskCountMap[row.projectId])
                taskCountMap[row.projectId] = { total: 0, completed: 0 };
            taskCountMap[row.projectId].total += row._count.id;
            if (row.status === 'completed')
                taskCountMap[row.projectId].completed += row._count.id;
        }
        const projectsWithProgress = projects.map((project) => {
            const counts = taskCountMap[project.id] || { total: 0, completed: 0 };
            const isMember = project.members.some((m) => m.userId === user.id);
            const isProjectManager = project.members.some((m) => m.userId === user.id && m.isProjectManager);
            return {
                ...project,
                progress: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
                totalTasks: counts.total,
                completedTasks: counts.completed,
                isMember,
                isProjectManager,
            };
        });
        return { projects: projectsWithProgress, total };
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=project.service.js.map