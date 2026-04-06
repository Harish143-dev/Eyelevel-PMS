import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';
import { getIO } from '../config/socket';
import { notifyTaskAssigned, notifyStatusChanged } from '../services/notification.service';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { Role, RoleGroups } from '../config/roles';
import { Prisma } from '@prisma/client';

// Helper: Check if user can modify a task
const canModifyTask = (
  userRole: string,
  userId: string,
  task: { createdBy: string; assignedTo: string | null; projectId: string },
  projectManagerCheck?: boolean
): 'full' | 'assignee_edit' | 'status_only' | 'none' => {
  // Staff roles (Admin, Manager, HR) have full control over all tasks
  if (RoleGroups.STAFF.includes(userRole as any)) return 'full';
  
  // Creators have full control
  if (task.createdBy === userId) return 'full';
  
  // Project Managers have full control
  if (projectManagerCheck) return 'full'; 

  // Assignees have full control over their own task content and status
  if (task.assignedTo === userId) return 'full';
  
  return 'none';
};

// GET /api/projects/:id/tasks
export const getProjectTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const role = req.user!.role;

    // For non-admin roles, verify membership
    if (!RoleGroups.STAFF.includes(role as any)) {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId: id, userId: req.user!.id },
      });
      if (!membership) {
        res.status(403).json({ message: 'You are not a member of this project' });
        return;
      }
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id, parentTaskId: null, isDeleted: false },
        include: {
          assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
          creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
          customStatus: true,
          customPriority: true,
          _count: { select: { comments: true, attachments: true, subtasks: true } },
          dependsOn: { select: { id: true, blockingTaskId: true } },
          blockedBy: { select: { id: true, dependentTaskId: true } },
        },
        orderBy: [{ status: 'asc' }, { position: 'asc' }],
      });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/my
export const getMyTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const paginationParams = parsePagination(req.query);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: { assignedTo: userId, isDeleted: false }, // Include subtasks for assigned view
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
          creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
          customStatus: true,
          customPriority: true,
          _count: { select: { comments: true, attachments: true, subtasks: true } },
        },
        orderBy: { dueDate: 'asc' },
        skip: paginationParams.skip,
        take: paginationParams.take,
      }),
      prisma.task.count({ where: { assignedTo: userId } })
    ]);

    res.json({
      ...paginatedResponse(tasks, total, paginationParams),
      tasks // for frontend compatibility
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks
export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { assignedTo, projectId, status, priority, isDeleted } = req.query;
    const paginationParams = parsePagination(req.query);

    const where: Prisma.TaskWhereInput = {
      isDeleted: isDeleted === 'true',
      // If filtering by project or assignee, we might want to see subtasks too
      // But if it's a general list, we only want top-level
      parentTaskId: (projectId || assignedTo) ? undefined : null,
      // TENANT ISOLATION: scope to user's company via project
      ...(req.user!.companyId ? { project: { companyId: req.user!.companyId } } : {}),
    };

    if (assignedTo) where.assignedTo = assignedTo as string;
    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as any;
    if (priority) where.priority = priority as any;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
          creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
          customStatus: true,
          customPriority: true,
          _count: { select: { comments: true, attachments: true, subtasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: paginationParams.skip,
        take: paginationParams.take,
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      ...paginatedResponse(tasks, total, paginationParams),
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    console.log(`[TASKS] getTaskById called for ID: ${id} by User: ${req.user!.id} (Role: ${req.user!.role})`);
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, email: true, avatarColor: true, designation: true } },
        project: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatarColor: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: { uploader: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarColor: true } },
          },
          orderBy: { position: 'asc' },
        },
        dependsOn: {
          include: {
            blockingTask: { select: { id: true, title: true, status: true } },
          },
        },
      } as any,
    });

    if (!task || task.isDeleted) {
      console.log(`[TASKS] Task with ID ${id} not found or deleted`);
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // TENANT ISOLATION: verify task's project belongs to user's company
    const project = await prisma.project.findUnique({ where: { id: task.projectId }, select: { companyId: true } });
    if (req.user!.companyId && project?.companyId && project.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Calculate permission level for the current user
    const isProjectManager = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: req.user!.id, isProjectManager: true },
    });

    const permissionLevel = canModifyTask(
      req.user!.role,
      req.user!.id,
      task,
      !!isProjectManager
    );

    console.log(`[TASKS] Permission level for ${req.user!.id} on task ${id}: ${permissionLevel}`);
    res.json({ task, permissionLevel });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/tasks
export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { title, description, assignedTo, status, dueDate, priority, customFields, recurringRule } = req.body;

    if (!title || !dueDate) {
      res.status(400).json({ message: 'Title and due date are required' });
      return;
    }

    // Check project is not archived
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.isDeleted) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.isArchived) {
      res.status(400).json({ message: 'Cannot create tasks in an archived project' });
      return;
    }

    // Verify task due date is not after project deadline
    if (dueDate && project.deadline) {
      const taskDate = new Date(dueDate);
      const projectDate = new Date(project.deadline);
      if (taskDate > projectDate) {
        res.status(400).json({ 
          message: `Task due date (${taskDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`,
          error: 'DEADLINE_EXCEEDED'
        });
        return;
      }
    }

    // Check membership for non-admins
    const role = req.user!.role;
    if (!RoleGroups.STAFF.includes(role as any)) {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.user!.id },
      });
      if (!membership) {
        res.status(403).json({ message: 'You are not a member of this project' });
        return;
      }
    }

    // Get the max position in this project for the given status
    const maxPosition = await prisma.task.findFirst({
      where: { projectId, status: 'pending', parentTaskId: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    // Non-admin/super_admin users can only assign tasks to themselves  
    let finalAssignedTo = assignedTo;
    if (req.user!.role === Role.EMPLOYEE) {
      // Check if user is a project manager
      const isPM = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.user!.id, isProjectManager: true },
      });
      if (!isPM) {
        finalAssignedTo = req.user!.id;
      }
    }

    // Map to custom status if company uses dynamic workflows
    let finalCustomStatusId: string | null = req.body.customStatusId || null;
    let finalCustomPriorityId: string | null = req.body.customPriorityId || null;

    if (req.user!.companyId && !finalCustomStatusId) {
      const defaultStatus = await prisma.customTaskStatus.findFirst({
        where: { companyId: req.user!.companyId, isDefault: true, name: 'To Do' }
      }) || await prisma.customTaskStatus.findFirst({
        where: { companyId: req.user!.companyId },
        orderBy: { orderIndex: 'asc' }
      });
      if (defaultStatus) finalCustomStatusId = defaultStatus.id;
    }

    if (req.user!.companyId && !finalCustomPriorityId) {
      const defaultPriority = await prisma.customTaskPriority.findFirst({
        where: { companyId: req.user!.companyId, name: 'Medium' }
      });
      if (defaultPriority) finalCustomPriorityId = defaultPriority.id;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        companyId: req.user!.companyId,
        createdBy: req.user!.id,
        assignedTo: finalAssignedTo || null,
        status: status || 'pending',
        customStatusId: finalCustomStatusId,
        priority: priority || 'medium',
        customPriorityId: finalCustomPriorityId,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (maxPosition?.position ?? -1) + 1,
        customFields: customFields || undefined,
        recurringRule: recurringRule || null,
      } as any,
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
        customStatus: true,
        customPriority: true
      } as any,
    });

    // Notify assignee
    if (task.assignedTo && task.assignedTo !== req.user!.id) {
      await notifyTaskAssigned(task.assignedTo, task.title, task.id, projectId, req.user!.name);
    }

    await logActivity(
      req.user!.id,
      'CREATED_TASK',
      'task',
      task.id,
      `Created task "${task.title}" in project`
    );

    // Emit socket event
    getIO().to(`project:${projectId}`).emit('task:created', task);

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id — full edit
export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, dueDate, priority, assignedTo, status, position, customFields, recurringRule, customStatusId, customPriorityId } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // TENANT ISOLATION: verify task's project belongs to user's company
    const taskProject = await prisma.project.findUnique({ where: { id: existingTask.projectId }, select: { companyId: true } });
    if (req.user!.companyId && taskProject?.companyId && taskProject.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check task ownership
    const isProjectManager = await prisma.projectMember.findFirst({
      where: { projectId: existingTask.projectId, userId: req.user!.id, isProjectManager: true },
    });

    const permission = canModifyTask(req.user!.role, req.user!.id, existingTask, !!isProjectManager);

    if (permission === 'none') {
      res.status(403).json({ message: 'Not authorized to update this task' });
      return;
    }

    // Verify task due date is not after project deadline
    const project = await prisma.project.findUnique({ where: { id: existingTask.projectId } });
    if (dueDate && project?.deadline) {
      const taskDate = new Date(dueDate);
      const projectDate = new Date(project.deadline);
      if (taskDate > projectDate) {
        res.status(400).json({ 
          message: `Task due date (${taskDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`,
          error: 'DEADLINE_EXCEEDED'
        });
        return;
      }
    }

    if (permission === 'status_only') {
      // Basic assignees can only update status
      if (title || description || dueDate || priority || assignedTo || position !== undefined || customFields !== undefined) {
        res.status(403).json({ message: 'You can only update the status of this task' });
        return;
      }
    }

    // Legacy assignee_edit block removed as assignees now have full content edit rights
    // but assignment restrictions still apply below.

    // Non-admin/PM cannot reassign tasks to others
    let finalAssignedTo = assignedTo;
    if (req.user!.role === Role.EMPLOYEE && !isProjectManager && assignedTo && assignedTo !== req.user!.id) {
      finalAssignedTo = existingTask.assignedTo;
    }

    // Sync standard status with custom status category if custom status is provided
    let finalStatus = status;
    if (customStatusId) {
      const customStatus = await prisma.customTaskStatus.findUnique({ where: { id: customStatusId } });
      if (customStatus) {
        finalStatus = customStatus.standardStatus;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        assignedTo: finalAssignedTo,
        status: finalStatus,
        customStatusId: customStatusId !== undefined ? customStatusId : undefined,
        customPriorityId: customPriorityId !== undefined ? customPriorityId : undefined,
        position,
        customFields,
        recurringRule: recurringRule !== undefined ? (recurringRule || null) : undefined,
      } as any,
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
        customStatus: true,
        customPriority: true
      } as any,
    });

    // Notify on assignment change
    if (assignedTo && assignedTo !== existingTask.assignedTo && assignedTo !== req.user!.id) {
      await notifyTaskAssigned(assignedTo, task.title, task.id, task.projectId, req.user!.name);
    }

    // Notify on status change
    if (status && status !== existingTask.status) {
      // Notify creator if they're not the one changing it
      if (existingTask.createdBy !== req.user!.id) {
        await notifyStatusChanged(existingTask.createdBy, task.title, task.id, task.projectId, status, req.user!.name);
      }
      // Notify assignee if they're not the one changing it
      if (existingTask.assignedTo && existingTask.assignedTo !== req.user!.id) {
        await notifyStatusChanged(existingTask.assignedTo, task.title, task.id, task.projectId, status, req.user!.name);
      }
    }

    await logActivity(req.user!.id, 'UPDATED_TASK', 'task', task.id, `Updated task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // TENANT ISOLATION: verify task's project belongs to user's company
    const delTaskProject = await prisma.project.findUnique({ where: { id: task.projectId }, select: { companyId: true } });
    if (req.user!.companyId && delTaskProject?.companyId && delTaskProject.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check task ownership
    const isProjectManager = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: req.user!.id, isProjectManager: true },
    });

    const permission = canModifyTask(req.user!.role, req.user!.id, task, !!isProjectManager);

    if (permission !== 'full') {
      res.status(403).json({ message: 'Not authorized to delete this task' });
      return;
    }

    const projectId = task.projectId;
    await prisma.task.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await logActivity(req.user!.id, 'DELETED_TASK', 'task', id, `Deleted task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${projectId}`).emit('task:deleted', id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/deleted — admin only
export const getDeletedTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { 
        isDeleted: true,
        ...(req.user?.companyId ? { project: { companyId: req.user.companyId } } : {})
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/restore — admin only
export const restoreTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || !task.isDeleted) {
      res.status(404).json({ message: 'Deleted task not found' });
      return;
    }

    await prisma.task.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
    });

    await logActivity(req.user!.id, 'RESTORED_TASK', 'task', id, `Restored task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:created', task);

    res.json({ message: 'Task restored' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/status — assignee or creator or admin can update
export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['pending', 'ongoing', 'in_review', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check permission: creator, assignee, admin, super_admin, or PM
    const isProjectManager = await prisma.projectMember.findFirst({
      where: { projectId: existingTask.projectId, userId: req.user!.id, isProjectManager: true },
    });

    const permission = canModifyTask(req.user!.role, req.user!.id, existingTask, !!isProjectManager);

    if (permission === 'none') {
      res.status(403).json({ message: 'Not authorized to update this task status' });
      return;
    }

    // Task dependency enforcement
    if (status === 'completed' || status === 'in_review') {
      const blockingDependencies = await prisma.taskDependency.findMany({
        where: { dependentTaskId: id },
        include: { blockingTask: true },
      });

      const uncompletedBlockers = blockingDependencies.filter(
        d => d.blockingTask.status !== 'completed'
      );

      if (uncompletedBlockers.length > 0) {
        res.status(400).json({ 
          message: 'Cannot update status. This task is blocked by pending tasks.',
          uncompletedBlockers: uncompletedBlockers.map(d => d.blockingTask.title)
        });
        return;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
      },
    });

    // Notifications
    if (existingTask.createdBy !== req.user!.id) {
      await notifyStatusChanged(existingTask.createdBy, task.title, task.id, task.projectId, status, req.user!.name);
    }
    if (existingTask.assignedTo && existingTask.assignedTo !== req.user!.id) {
      await notifyStatusChanged(existingTask.assignedTo, task.title, task.id, task.projectId, status, req.user!.name);
    }

    await logActivity(
      req.user!.id,
      'CHANGED_STATUS',
      'task',
      task.id,
      `Changed task "${task.title}" status to ${status}`
    );

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/assign — self-assign or admin/PM reassign
export const assignTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { assignedTo } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Non-admin can only assign to themselves (unless PM)
    if (req.user!.role === Role.EMPLOYEE) {
      const isPM = await prisma.projectMember.findFirst({
        where: { projectId: existingTask.projectId, userId: req.user!.id, isProjectManager: true },
      });
      if (!isPM && assignedTo && assignedTo !== req.user!.id) {
        res.status(403).json({ message: 'You can only assign tasks to yourself' });
        return;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: { assignedTo: assignedTo || req.user!.id },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
      },
    });

    // Notify new assignee
    const finalAssignee = assignedTo || req.user!.id;
    if (finalAssignee !== req.user!.id) {
      await notifyTaskAssigned(finalAssignee, task.title, task.id, task.projectId, req.user!.name);
    }

    await logActivity(req.user!.id, 'ASSIGNED_TASK', 'task', task.id, `Assigned task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/position — kanban drag position
export const updateTaskPosition = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    let { status, position, customStatusId } = req.body;

    // Handle being passed a UUID for status (i.e. custom workflow status from Kanban)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(status);
    if (isUUID) {
       customStatusId = status;
       const customStatus = await prisma.customTaskStatus.findUnique({ where: { id: customStatusId } });
       status = customStatus?.standardStatus || 'ongoing'; 
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check permission for moving tasks (status change)
    const isProjectManager = await prisma.projectMember.findFirst({
      where: { projectId: existingTask.projectId, userId: req.user!.id, isProjectManager: true },
    });

    const permission = canModifyTask(req.user!.role, req.user!.id, existingTask, !!isProjectManager);

    if (permission === 'none') {
      res.status(403).json({ message: 'Not authorized to move this task' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: { 
        status, 
        position,
        customStatusId: customStatusId !== undefined ? customStatusId : undefined 
      } as any,
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
        customStatus: true,
        customPriority: true
      } as any,
    });

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

// --- Subtask endpoints ---

// GET /api/tasks/:id/subtasks
export const getSubtasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parentId = req.params.id as string;

    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: parentId },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { position: 'asc' },
    });

    res.json({ subtasks });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/subtasks
export const createSubtask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parentId = req.params.id as string;
    const { title, assignedTo, dueDate, priority, customFields } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Subtask title is required' });
      return;
    }

    const parentTask = await prisma.task.findUnique({ 
      where: { id: parentId },
      include: { project: true }
    });

    if (!parentTask) {
      res.status(404).json({ message: 'Parent task not found' });
      return;
    }

    // Verify subtask due date is not after project deadline
    const project = parentTask.project;
    if (dueDate && project.deadline) {
      const subtaskDate = new Date(dueDate);
      const projectDate = new Date(project.deadline);
      if (subtaskDate > projectDate) {
        res.status(400).json({ 
          message: `Subtask due date (${subtaskDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})` 
        });
        return;
      }
    }

    // Get max position among existing subtasks
    const maxPos = await prisma.task.findFirst({
      where: { parentTaskId: parentId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const subtask = await prisma.task.create({
      data: {
        title,
        projectId: parentTask.projectId,
        createdBy: req.user!.id,
        assignedTo: req.user!.role === Role.EMPLOYEE ? req.user!.id : (assignedTo || null),
        parentTaskId: parentId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        position: (maxPos?.position ?? -1) + 1,
        customFields: customFields || undefined,
      } as any,
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    // Notify assignee
    if (subtask.assignedTo && subtask.assignedTo !== req.user!.id) {
      await notifyTaskAssigned(subtask.assignedTo, subtask.title, subtask.id, parentTask.projectId, req.user!.name);
    }

    await logActivity(req.user!.id, 'CREATED_SUBTASK', 'task', subtask.id, `Created subtask "${subtask.title}"`);

    res.status(201).json({ subtask });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/dependencies
export const addDependency = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { blockingTaskId } = req.body;

    if (id === blockingTaskId) {
       res.status(400).json({ message: 'Task cannot depend on itself' });
       return;
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // --- Circular Dependency Detection (BFS, max 20 hops) ---
    // We check: would adding (blockingTaskId → id) create a cycle?
    // i.e., is `id` already reachable FROM `blockingTaskId` through existing dependencies?
    const visited = new Set<string>();
    const queue: string[] = [id]; // start from the dependent task
    const MAX_DEPTH = 20;
    let depth = 0;

    while (queue.length > 0 && depth < MAX_DEPTH) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // If we reach blockingTaskId while traversing from id, it means id already
      // blocks blockingTaskId, creating a cycle if we add blockingTaskId → id.
      if (current === blockingTaskId) {
        res.status(400).json({ message: 'Circular dependency detected. This would create an infinite dependency loop.' });
        return;
      }

      // Find all tasks that `current` blocks (i.e. current is a blocking task for these)
      const outgoing = await prisma.taskDependency.findMany({
        where: { blockingTaskId: current },
        select: { dependentTaskId: true },
      });

      for (const dep of outgoing) {
        if (!visited.has(dep.dependentTaskId)) {
          queue.push(dep.dependentTaskId);
        }
      }
      depth++;
    }
    // --- End Circular Dependency Detection ---

    const dependency = await prisma.taskDependency.create({
      data: {
        dependentTaskId: id,
        blockingTaskId
      },
      include: {
        blockingTask: { select: { id: true, title: true, status: true } }
      }
    });

    res.status(201).json({ message: 'Dependency added', dependency });
  } catch (error) {
    console.error('Add dependency error:', error);
    res.status(500).json({ message: 'Failed to add dependency. It may already exist.' });
  }
};

// DELETE /api/tasks/:id/dependencies/:blockingTaskId
export const removeDependency = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const blockingTaskId = req.params.blockingTaskId as string;

    await prisma.taskDependency.delete({
      where: {
        dependentTaskId_blockingTaskId: {
          dependentTaskId: id,
          blockingTaskId: blockingTaskId,
        }
      }
    });
    
    res.json({ message: 'Dependency removed' });
  } catch (error: any) {
    if (error.code === 'P2025') {
       res.status(404).json({ message: 'Dependency not found' });
       return;
    }
    res.status(500).json({ message: 'Failed to remove dependency' });
  }
};
