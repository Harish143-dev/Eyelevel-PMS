import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../config/socket';
import { notifyCommentAdded, notifyUserMentioned } from '../services/notification.service';

// GET /api/tasks/:id/comments
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.id as string },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/tasks/:id/comments
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, mentions } = req.body;
    const taskId = req.params.id as string;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Comment content is required' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true, createdBy: true, assignedTo: true },
    });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: req.user!.id,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    const mentionedUserIds: string[] = Array.isArray(mentions) ? mentions : [];
    
    // Notify mentioned users
    for (const userId of mentionedUserIds) {
      if (userId !== req.user!.id) {
        await notifyUserMentioned(userId, task.title, taskId, task.projectId, req.user!.name);
      }
    }

    // Notify task creator (if not the commenter and not mentioned)
    if (task.createdBy !== req.user!.id && !mentionedUserIds.includes(task.createdBy)) {
      await notifyCommentAdded(task.createdBy, task.title, taskId, task.projectId, req.user!.name);
    }

    // Notify task assignee (if not the commenter, different from creator, and not mentioned)
    if (task.assignedTo && task.assignedTo !== req.user!.id && task.assignedTo !== task.createdBy && !mentionedUserIds.includes(task.assignedTo)) {
      await notifyCommentAdded(task.assignedTo, task.title, taskId, task.projectId, req.user!.name);
    }

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('comment:created', { taskId, comment });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/comments/:id
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const existing: any = await prisma.comment.findUnique({ 
      where: { id: id as string },
      include: { task: { select: { projectId: true } } }
    });
    if (!existing) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (existing.userId !== req.user!.id) {
      res.status(403).json({ message: 'Can only edit your own comments' });
      return;
    }

    const comment = await prisma.comment.update({
      where: { id: id as string },
      data: { content: content.trim(), isEdited: true },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } },
      },
    });

    // Emit socket event
    getIO().to(`project:${existing.task.projectId}`).emit('comment:updated', { taskId: comment.taskId, comment });

    res.json({ comment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing: any = await prisma.comment.findUnique({ 
      where: { id: id as string },
      include: { task: { select: { projectId: true } } }
    });
    if (!existing) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Owner of the comment or admin/super_admin can delete
    if (existing.userId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized to delete this comment' });
      return;
    }

    await prisma.comment.delete({ where: { id: id as string } });

    // Emit socket event
    getIO().to(`project:${existing.task.projectId}`).emit('comment:deleted', { taskId: existing.taskId, commentId: id });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
