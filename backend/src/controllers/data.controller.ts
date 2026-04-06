import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export const exportTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { companyId: req.user!.companyId, isDeleted: false },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true, email: true } },
        customStatus: { select: { name: true } },
        customPriority: { select: { name: true } },
      }
    } as any);

    const csvLines = [
      'ID,Title,Status,Priority,AssignedTo,DueDate,ProjectName'
    ];

    tasks.forEach((task: any) => {
      const statusTitle = task.customStatus?.name || task.status;
      const priorityTitle = task.customPriority?.name || task.priority;
      const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
      csvLines.push(`${task.id},"${task.title}",${statusTitle},${priorityTitle},"${task.assignee?.name || ''}",${dueDateStr},"${task.project?.name || ''}"`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks_export.csv');
    res.status(200).send(csvLines.join('\n'));
  } catch (error) {
    console.error('Task export error:', error);
    res.status(500).json({ message: 'Failed to export tasks' });
  }
};

export const exportProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { companyId: req.user!.companyId, isDeleted: false },
    } as any);

    const csvLines = [ 'ID,Name,Status,StartDate,Deadline' ];

    projects.forEach((p: any) => {
      const startStr = p.startDate ? new Date(p.startDate).toLocaleDateString() : '';
      const finishStr = p.deadline ? new Date(p.deadline).toLocaleDateString() : '';
      csvLines.push(`${p.id},"${p.name}",${p.status},${startStr},${finishStr}`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=projects_export.csv');
    res.status(200).send(csvLines.join('\n'));
  } catch (error) {
    console.error('Project export error:', error);
    res.status(500).json({ message: 'Failed to export projects' });
  }
};

export const exportEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user!.companyId, isDeleted: false } as any,
      include: {
        department: { select: { name: true } }
      }
    } as any);

    const csvLines = [ 'ID,Name,Email,Role,Department,JoinDate' ];

    users.forEach((u: any) => {
      const joinStr = u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '';
      csvLines.push(`${u.id},"${u.name}",${u.email},${u.role},"${u.department?.name || ''}",${joinStr}`);
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees_export.csv');
    res.status(200).send(csvLines.join('\n'));
  } catch (error) {
    console.error('Employee export error:', error);
    res.status(500).json({ message: 'Failed to export employees' });
  }
};
