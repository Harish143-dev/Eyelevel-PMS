import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyMilestoneCompleted } from '../services/notification.service';
import { Role, RoleGroups } from '../config/roles';

export const createMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;
    const { title, description, dueDate, status } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.isDeleted) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Authorization: only members
    if (!RoleGroups.STAFF.includes(req.user!.role as any)) {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.user!.id },
      });
      if (!membership) {
        res.status(403).json({ message: 'You are not a member of this project' });
        return;
      }
    }

    // Verify milestone due date is not after project deadline
    if (dueDate && project.deadline) {
      const milestoneDate = new Date(dueDate);
      const projectDate = new Date(project.deadline);
      if (milestoneDate > projectDate) {
        res.status(400).json({ 
          message: `Milestone due date (${milestoneDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})` 
        });
        return;
      }
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title,
        description,
        status: status || 'pending',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    res.status(201).json({ milestone });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProjectMilestones = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId as string;

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: {
         tasks: { select: { id: true, title: true, status: true, dueDate: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, status } = req.body;

    // Fetch existing to detect status change
    const existing = await prisma.milestone.findUnique({ where: { id: id as string } });
    if (!existing) {
      res.status(404).json({ message: 'Milestone not found' });
      return;
    }

    // Fetch project for deadline validation and authorization
    const project = await prisma.project.findUnique({ where: { id: existing.projectId } });
    
    // Authorization: only members
    if (!RoleGroups.STAFF.includes(req.user!.role as any)) {
      const membership = await prisma.projectMember.findFirst({
        where: { projectId: existing.projectId, userId: req.user!.id },
      });
      if (!membership) {
        res.status(403).json({ message: 'You are not authorized to edit this milestone' });
        return;
      }
    }

    // Verify milestone due date is not after project deadline
    if (dueDate && project?.deadline) {
      const milestoneDate = new Date(dueDate);
      const projectDate = new Date(project.deadline);
      if (milestoneDate > projectDate) {
        res.status(400).json({ 
          message: `Milestone due date (${milestoneDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})` 
        });
        return;
      }
    }

    const milestone = await prisma.milestone.update({
      where: { id: id as string },
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    // If status just changed to completed, notify all project members
    if (status === 'completed' && existing && existing.status !== 'completed') {
      try {
        await notifyMilestoneCompleted(milestone.projectId, milestone.title, req.user!.name);
      } catch (e) {
        console.error('Failed to send milestone notification:', e);
      }
    }

    res.json({ milestone });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.milestone.delete({ where: { id: id as string } });
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
