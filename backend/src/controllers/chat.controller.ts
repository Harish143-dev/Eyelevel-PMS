import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../config/socket';

export const getChannels = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.query.projectId as string | undefined;

    let whereClause = {};
    if (projectId) {
      whereClause = { projectId };
    } else {
      whereClause = { isDirect: false, projectId: null }; // Example for global channels
    }

    const channels = await prisma.chatChannel.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    res.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createChannel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, projectId, isDirect } = req.body;

    const channel = await prisma.chatChannel.create({
      data: {
        name,
        projectId: projectId || null,
        isDirect: isDirect || false
      }
    });

    res.status(201).json({ channel });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;

    const messages = await prisma.chatMessage.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const postMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const { content } = req.body;
    const userId = req.user!.id;

    const message = await prisma.chatMessage.create({
      data: {
        channelId,
        content,
        userId
      },
      include: {
        user: { select: { id: true, name: true, avatarColor: true } }
      }
    });

// Emit new message via WebSockets to the room for this channel
    getIO().to(`channel:${channelId}`).emit('chat:message', message);

    res.status(201).json({ message });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const { content } = req.body;
    const userId = req.user!.id;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
       res.status(404).json({ message: 'Message not found' });
       return;
    }

    if (message.userId !== userId) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content, isEdited: true } as any, // Cast to any because prisma generate hasn't run yet
      include: {
        user: { select: { id: true, name: true, avatarColor: true } }
      }
    });

    getIO().to(`channel:${message.channelId}`).emit('chat:message_updated', updatedMessage);

    res.json({ message: updatedMessage });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
       res.status(404).json({ message: 'Message not found' });
       return;
    }

    // Allow owner or admin to delete
    if (message.userId !== userId && userRole !== 'admin') {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    getIO().to(`channel:${message.channelId}`).emit('chat:message_deleted', { 
      id: messageId, 
      channelId: message.channelId 
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
