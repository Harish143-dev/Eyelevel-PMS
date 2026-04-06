import prisma from '../config/db';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { RoleGroups, Role } from '../config/roles';

export class ProjectService {
  /**
   * Complex logic to determine who becomes the Project Manager and which department defaults apply.
   */
  static async resolveProjectMembers(
    creatorId: string,
    providedMemberIds: string[],
    projectManagerId?: string,
    departmentId?: string,
    otherDepartmentIds?: string[]
  ): Promise<{ finalMemberIds: string[], finalProjectManagerId: string }> {
    const allMemberIdsSet = new Set<string>(providedMemberIds || []);
    let finalProjectManagerId = projectManagerId || creatorId;

    let primaryDeptManagerId: string | null = null;
    if (departmentId) {
      const primaryDept = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { users: { select: { id: true } } }
      });
      if (primaryDept) {
        primaryDept.users.forEach(u => allMemberIdsSet.add(u.id));
        primaryDeptManagerId = (primaryDept as any).managerId;
      }
    }

    if (otherDepartmentIds && otherDepartmentIds.length > 0) {
      const otherDeptsUsers = await prisma.user.findMany({
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
  static async getPaginatedProjects(filterParams: any, user: any, paginationParams: any) {
    const where: any = { isDeleted: false };

    if (user.companyId) where.companyId = user.companyId;

    where.isArchived = filterParams.showArchived;

    if (filterParams.category) where.category = filterParams.category;
    if (filterParams.status) where.status = filterParams.status;
    if (filterParams.search) where.name = { contains: filterParams.search, mode: 'insensitive' };
    if (filterParams.managerId) where.ownerId = filterParams.managerId;

    if (filterParams.deadline) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      if (filterParams.deadline === 'today') {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        where.deadline = { gte: now, lt: tomorrow };
      } else if (filterParams.deadline === 'this-week') {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        where.deadline = { gte: now, lte: endOfWeek };
      } else if (filterParams.deadline === 'overdue') {
        where.deadline = { lt: now };
        where.status = { not: 'completed' };
      }
    }

    const isPrivileged = RoleGroups.STAFF.includes(user.role);
    if (!isPrivileged) {
      where.members = { some: { userId: user.id } };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
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
      prisma.project.count({ where }),
    ]);

    // Fast metric lookup without N+1 logic
    const projectIds = projects.map((p: any) => p.id);
    const taskCounts = await prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: { projectId: { in: projectIds }, parentTaskId: null, isDeleted: false },
      _count: { id: true },
    });

    const taskCountMap: Record<string, { total: number; completed: number }> = {};
    for (const row of taskCounts) {
      if (!taskCountMap[row.projectId]) taskCountMap[row.projectId] = { total: 0, completed: 0 };
      taskCountMap[row.projectId].total += row._count.id;
      if (row.status === 'completed') taskCountMap[row.projectId].completed += row._count.id;
    }

    const projectsWithProgress = projects.map((project: any) => {
      const counts = taskCountMap[project.id] || { total: 0, completed: 0 };
      const isMember = project.members.some((m: any) => m.userId === user.id);
      const isProjectManager = project.members.some((m: any) => m.userId === user.id && m.isProjectManager);

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
