import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

// GET /api/projects
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let projects;

    if (req.user!.role === 'admin') {
      projects = await prisma.project.findMany({
        include: {
          owner: { select: { id: true, name: true, avatarColor: true } },
          members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user!.id } },
        },
        include: {
          owner: { select: { id: true, name: true, avatarColor: true } },
          members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Add progress percentage
    const projectsWithProgress = await Promise.all(
      projects.map(async (project: any) => {
        const totalTasks = await prisma.task.count({ where: { projectId: project.id } });
        const completedTasks = await prisma.task.count({
          where: { projectId: project.id, status: 'completed' },
        });
        return {
          ...project,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          totalTasks,
          completedTasks,
        };
      })
    );

    res.json({ projects: projectsWithProgress });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/projects/:id
export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id as string },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatarColor: true } },
            creator: { select: { id: true, name: true, avatarColor: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Non-admin users can only see projects they're members of
    if (req.user!.role !== 'admin') {
      const isMember = project.members.some((m: any) => m.userId === req.user!.id);
      if (!isMember) {
        res.status(403).json({ message: 'Not a member of this project' });
        return;
      }
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t: any) => t.status === 'completed').length;

    res.json({
      project: {
        ...project,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalTasks,
        completedTasks,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/projects — admin only
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, startDate, deadline, memberIds } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Project name is required' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: req.user!.id,
        members: {
          create: [
            { userId: req.user!.id }, // owner is always a member
            ...(memberIds || [])
              .filter((id: string) => id !== req.user!.id)
              .map((userId: string) => ({ userId })),
          ],
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      },
    });

    await logActivity(req.user!.id, 'CREATED_PROJECT', 'project', project.id, `Created project "${project.name}"`);

    res.status(201).json({ project: { ...project, progress: 0, totalTasks: 0, completedTasks: 0 } });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/projects/:id — admin only
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, status, startDate, deadline } = req.body;
    const projectId = id as string;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      },
    });

    await logActivity(req.user!.id, 'UPDATED_PROJECT', 'project', project.id, `Updated project "${project.name}"`);

    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/projects/:id — admin only
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectId = id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    await prisma.project.delete({ where: { id: projectId } });

    await logActivity(req.user!.id, 'DELETED_PROJECT', 'project', projectId, `Deleted project "${project.name}"`);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/projects/:id/members — admin only
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const projectId = id as string;

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: userId as string } },
    });

    if (existing) {
      res.status(409).json({ message: 'User is already a member' });
      return;
    }

    await prisma.projectMember.create({
      data: { projectId, userId: userId as string },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      },
    });

    await logActivity(req.user!.id, 'ADDED_MEMBER', 'project', projectId, `Added member to project`);

    res.json({ project });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/projects/:id/members/:userId — admin only
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const projectId = id as string;
    const memberId = userId as string;

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberId } },
    });

    await logActivity(req.user!.id, 'REMOVED_MEMBER', 'project', projectId, `Removed member from project`);

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
