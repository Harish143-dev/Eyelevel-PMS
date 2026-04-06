import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/templates
export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await (prisma as any).projectTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/templates/:id
export const getTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const template = await (prisma as any).projectTemplate.findUnique({
      where: { id: id as string },
    });
    if (!template) {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/templates
export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, tasks, milestones } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Template name is required' });
      return;
    }

    const template = await (prisma as any).projectTemplate.create({
      data: {
        name,
        description: description || null,
        category: category || null,
        tasks: tasks || [],
        milestones: milestones || [],
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/templates/from-project/:projectId — save existing project as template
export const createTemplateFromProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      include: {
        tasks: {
          where: { parentTaskId: null },
          select: { title: true, description: true, priority: true, status: true },
          orderBy: { position: 'asc' },
        },
        milestones: {
          select: { title: true, description: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const templateTasks = project.tasks.map((t: any) => ({
      title: t.title,
      description: t.description,
      priority: t.priority,
    }));

    const templateMilestones = (project as any).milestones?.map((m: any) => ({
      title: m.title,
      description: m.description,
    })) || [];

    const template = await (prisma as any).projectTemplate.create({
      data: {
        name: name || `${project.name} Template`,
        description: project.description,
        category: project.category,
        tasks: templateTasks,
        milestones: templateMilestones,
        createdBy: req.user!.id,
      },
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Create template from project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/templates/:id
export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, tasks, milestones } = req.body;

    const template = await (prisma as any).projectTemplate.update({
      where: { id: id as string },
      data: {
        name,
        description,
        category,
        tasks,
        milestones,
      },
    });

    res.json({ template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/templates/:id
export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await (prisma as any).projectTemplate.delete({
      where: { id: id as string },
    });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
