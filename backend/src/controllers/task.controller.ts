import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';
import { getIO } from '../config/socket';

// GET /api/projects/:id/tasks
export const getProjectTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        creator: { select: { id: true, name: true, avatarColor: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/tasks/my
export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const tasks = await prisma.task.findMany({
      where: { assignedTo: userId },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
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
      },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/projects/:id/tasks
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.id as string;
    const { title, description, assignedTo, dueDate, priority } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Task title is required' });
      return;
    }

    // Get the max position in this project for the given status
    const maxPosition = await prisma.task.findFirst({
      where: { projectId, status: 'pending' },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    // If user is not admin, they can only assign to themselves
    let finalAssignedTo = assignedTo;
    if (req.user!.role !== 'admin') {
      finalAssignedTo = req.user!.id;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        createdBy: req.user!.id,
        assignedTo: finalAssignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        position: (maxPosition?.position ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
      },
    });

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
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, dueDate, priority, assignedTo, status, position } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Non-admin can only update tasks assigned to them or created by them
    if (req.user!.role !== 'admin' && existingTask.assignedTo !== req.user!.id && existingTask.createdBy !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized to update this task' });
      return;
    }

    // Non-admin cannot reassign tasks to others
    let finalAssignedTo = assignedTo;
    if (req.user!.role !== 'admin' && assignedTo && assignedTo !== req.user!.id) {
      finalAssignedTo = existingTask.assignedTo;
    }

    // Validate status if provided
    const validStatuses = ['pending', 'ongoing', 'in_review', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
       res.status(400).json({ message: 'Invalid status' });
       return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        assignedTo: finalAssignedTo,
        status,
        position,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        creator: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    await logActivity(req.user!.id, 'UPDATED_TASK', 'task', task.id, `Updated task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (req.user!.role !== 'admin' && task.createdBy !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized to delete this task' });
      return;
    }

    const projectId = task.projectId;
    await prisma.task.delete({ where: { id } });

    await logActivity(req.user!.id, 'DELETED_TASK', 'task', id, `Deleted task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${projectId}`).emit('task:deleted', id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // User can only change status of tasks assigned to them
    if (req.user!.role !== 'admin' && existingTask.assignedTo !== req.user!.id) {
      res.status(403).json({ message: 'Only the assignee or admin can update status' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        creator: { select: { id: true, name: true, avatarColor: true } },
      },
    });

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
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/tasks/:id/assign — self-assign or admin reassign
export const assignTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { assignedTo } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Non-admin can only assign to themselves
    if (req.user!.role !== 'admin') {
      if (assignedTo && assignedTo !== req.user!.id) {
        res.status(403).json({ message: 'You can only assign tasks to yourself' });
        return;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: { assignedTo: assignedTo || req.user!.id },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true } },
        creator: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    await logActivity(req.user!.id, 'ASSIGNED_TASK', 'task', task.id, `Assigned task "${task.title}"`);

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/tasks/:id/position — kanban drag position
export const updateTaskPosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, position } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { status, position },
      include: {
        assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
        creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
      },
    });

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('task:updated', task);

    res.json({ task });
  } catch (error) {
    console.error('Update task position error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
