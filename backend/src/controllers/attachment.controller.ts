import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../config/socket';

// GET /api/tasks/:id/attachments
export const getAttachments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { taskId: req.params.id as string },
      include: {
        uploader: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ attachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/tasks/:id/attachments
export const uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        uploadedBy: req.user!.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });

    // Emit socket event
    getIO().to(`project:${task.projectId}`).emit('attachment:uploaded', { taskId, attachment });

    res.status(201).json({ attachment });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/attachments/:id/download
export const downloadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.id as string },
    });

    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    res.download(attachment.filePath, attachment.fileName);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/attachments/:id
export const deleteAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const attachment: any = await prisma.attachment.findUnique({ 
       where: { id: id as string },
       include: { task: { select: { projectId: true } } }
    });
    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    // Only uploader or admin can delete
    if (attachment.uploadedBy !== req.user!.id && req.user!.role !== 'manager') {
      res.status(403).json({ message: 'Not authorized to delete this file' });
      return;
    }

    // Delete file from disk
    try {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
    } catch (fsError) {
      console.error('File deletion error:', fsError);
    }

    await prisma.attachment.delete({ where: { id: id as string } });

    // Emit socket event
    getIO().to(`project:${attachment.task.projectId}`).emit('attachment:deleted', { taskId: attachment.taskId, attachmentId: id });

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
