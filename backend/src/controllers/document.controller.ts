import { Request, Response as ExResponse } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

export const getProjectDocuments = async (req: AuthRequest, res: ExResponse): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const documents = await (prisma as any).document.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatarColor: true } }
      }
    });
    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: ExResponse): Promise<void> => {
  try {
    const id = req.params.id as string;
    const document = await (prisma as any).document.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarColor: true } }
      }
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDocument = async (req: AuthRequest, res: ExResponse): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const { title, content } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const document = await (prisma as any).document.create({
      data: {
        title,
        content: content || '',
        projectId,
        createdBy: req.user!.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarColor: true } }
      }
    });

    await logActivity(req.user!.id, 'CREATED_DOCUMENT', 'project', projectId, `Created document "${title}"`);

    res.status(201).json({ document });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDocument = async (req: AuthRequest, res: ExResponse): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, content } = req.body;

    const existingDoc = await (prisma as any).document.findUnique({ where: { id } });
    if (!existingDoc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const document = await (prisma as any).document.update({
      where: { id },
      data: {
        title: title || existingDoc.title,
        content: content !== undefined ? content : existingDoc.content,
      },
      include: {
        creator: { select: { id: true, name: true, avatarColor: true } }
      }
    });

    await logActivity(req.user!.id, 'UPDATED_DOCUMENT', 'project', document.projectId, `Updated document "${document.title}"`);

    res.json({ document });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: ExResponse): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingDoc = await (prisma as any).document.findUnique({ where: { id } });
    if (!existingDoc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    await (prisma as any).document.delete({ where: { id } });

    await logActivity(req.user!.id, 'DELETED_DOCUMENT', 'project', existingDoc.projectId, `Deleted document "${existingDoc.title}"`);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
