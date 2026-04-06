import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';
import { getIO } from '../config/socket';
import { notifyProjectAdded, notifyProjectUpdated } from '../services/notification.service';
import { parsePagination, paginatedResponse } from '../utils/pagination';
import { Role, RoleGroups } from '../config/roles';
import { ProjectService } from '../services/project.service';

// GET /api/projects
export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filterParams = {
      showArchived: req.query.archived === 'true',
      category: req.query.category as string,
      status: req.query.status as string,
      search: req.query.search as string,
      managerId: req.query.managerId as string,
      deadline: req.query.deadline as string,
    };

    const paginationParams = parsePagination(req.query);

    const { projects, total } = await ProjectService.getPaginatedProjects(filterParams, req.user!, paginationParams);

    res.json({
      ...paginatedResponse(projects, total, paginationParams),
      // Keep 'projects' root key for existing frontend
      projects,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/categories — get distinct categories
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.project.findMany({
      where: { category: { not: null }, ...(req.user?.companyId ? { companyId: req.user.companyId } : {}) },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    res.json({ categories: categories.map((c) => c.category).filter(Boolean) });
  } catch (error) {
    console.error('Get categories error:', error);
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
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true, designation: true } },
          },
        },
        tasks: {
          where: { parentTaskId: null, isDeleted: false }, // Only parent tasks
          include: {
            assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
            creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
            _count: { select: { subtasks: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Check membership — non-admin/super_admin users must be members
    const isMember = project.members.some((m: any) => m.userId === req.user!.id);
    const isProjectManager = project.members.some(
      (m: any) => m.userId === req.user!.id && m.isProjectManager
    );

    const isPrivileged = RoleGroups.STAFF.includes(req.user!.role as any);

    if (!isPrivileged && !isMember) {
      res.status(403).json({ message: 'You are not a member of this project' });
      return;
    }

    // TENANT ISOLATION: verify project belongs to user's company
    if (req.user!.companyId && project.companyId && project.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t: any) => t.status === 'completed').length;

    res.json({
      project: {
        ...project,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalTasks,
        completedTasks,
        isMember,
        isProjectManager,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/projects — admin/super_admin only
export const createProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      name, description, status, startDate, deadline, memberIds, 
      category, templateId, clientId, departmentId, otherDepartmentIds, projectManagerId 
    } = req.body;

    if (!name || !category || !startDate || !deadline) {
      res.status(400).json({ message: 'Project name, category, start date, and deadline are required' });
      return;
    }

    if (new Date(deadline) < new Date(startDate)) {
      res.status(400).json({ message: 'Project deadline cannot be before the start date' });
      return;
    }

    let defaultTasks: any[] = [];
    let defaultMilestones: any[] = [];

    if (templateId) {
      const template = await (prisma as any).projectTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        if (Array.isArray(template.tasks)) {
          defaultTasks = template.tasks.map((t: any, index: number) => ({
            title: t.title, description: t.description || '', priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium', createdBy: req.user!.id, position: index * 1024, status: 'pending'
          }));
        }
        if (Array.isArray(template.milestones)) {
          defaultMilestones = template.milestones.map((m: any) => ({ title: m.title, description: m.description || '', status: 'pending' }));
        }
      }
    }

    // Rely on ProjectService to untangle the membership web
    const { finalMemberIds, finalProjectManagerId } = await ProjectService.resolveProjectMembers(
      req.user!.id,
      memberIds,
      projectManagerId,
      departmentId,
      otherDepartmentIds
    );

    const project = await prisma.project.create({
      data: {
        name, description, status: status || 'planning', category: category || null,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        ownerId: req.user!.id,
        companyId: req.user!.companyId || null,
        clientId: clientId || null,
        departmentId: departmentId || null,
        members: {
          create: finalMemberIds.map((userId: string) => ({ userId, isProjectManager: userId === finalProjectManagerId })),
        },
        tasks: defaultTasks.length > 0 ? { create: defaultTasks } : undefined,
        milestones: defaultMilestones.length > 0 ? { create: defaultMilestones } : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      },
    });

    if (finalMemberIds.length > 0) {
      for (const memberId of finalMemberIds) {
        if (memberId !== req.user!.id) await notifyProjectAdded(memberId, project.name, project.id, req.user!.name);
      }
    }

    await logActivity(req.user!.id, 'CREATED_PROJECT', 'project', project.id, `Created project "${project.name}"`);

    getIO().emit('project:created', project);

    res.status(201).json({ project: { ...project, progress: 0, totalTasks: 0, completedTasks: 0 } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/projects/:id — admin/super_admin only
export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, status, startDate, deadline, category, ownerId, clientId } = req.body;
    const projectId = id as string;

    // Check if archived
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (existing.isArchived || existing.isDeleted) {
      res.status(400).json({ message: 'Cannot update an archived or deleted project' });
      return;
    }

    // TENANT ISOLATION: verify project belongs to user's company
    if (req.user!.companyId && existing.companyId && existing.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Only super_admin can change ownerId
    const updateData: any = {
      name,
      description,
      status,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      clientId: clientId !== undefined ? (clientId || null) : undefined,
    };

    if (ownerId && req.user!.role === Role.ADMIN) {
      updateData.ownerId = ownerId;
      
      // Also ensure the new owner is a project manager in the members table
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: ownerId } },
        create: { projectId, userId: ownerId, isProjectManager: true },
        update: { isProjectManager: true },
      });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarColor: true } },
          },
        },
      },
    });

    await logActivity(req.user!.id, 'UPDATED_PROJECT', 'project', project.id, `Updated project "${project.name}"`);

    // Notify all members about the project update
    const memberIds = project.members.map(m => m.userId);
    for (const memberId of memberIds) {
      if (memberId !== req.user!.id) {
        let updateDesc = 'General details updated';
        if (status && status !== existing.status) updateDesc = `Status changed to ${status}`;
        else if (deadline && new Date(deadline).getTime() !== existing.deadline?.getTime()) updateDesc = `Deadline updated to ${new Date(deadline).toLocaleDateString()}`;

        await notifyProjectUpdated(memberId, project.name, project.id, updateDesc, req.user!.name);
      }
    }

    // Emit to ALL clients since dashboard/project lists need to update
    getIO().emit('project:updated', project);

    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/projects/:id — admin/super_admin only
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectId = id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await logActivity(req.user!.id, 'DELETED_PROJECT', 'project', projectId, `Deleted project "${project.name}"`);

    // Emit general deletion alert
    getIO().emit('project:deleted', projectId);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/projects/deleted — admin only
export const getDeletedProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { isDeleted: true, ...(req.user?.companyId ? { companyId: req.user.companyId } : {}) },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
    res.json({ projects });
  } catch (error) {
    console.error('Get deleted projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/projects/:id/restore — admin only
export const restoreProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectId = id as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.isDeleted) {
      res.status(404).json({ message: 'Deleted project not found' });
      return;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { isDeleted: false, deletedAt: null },
    });

    await logActivity(req.user!.id, 'RESTORED_PROJECT', 'project', projectId, `Restored project "${project.name}"`);

    // We can emit project:created here or a generic updated event to refresh lists
    getIO().emit('project:updated', project);

    res.json({ message: 'Project restored' });
  } catch (error) {
    console.error('Restore project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/projects/:id/members — admin/super_admin/project manager only
export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const projectId = id as string;

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    // Check project exists and is not archived
    const projectCheck = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectCheck) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (projectCheck.isArchived) {
      res.status(400).json({ message: 'Cannot add members to an archived project' });
      return;
    }

    // TENANT ISOLATION: verify the user being added belongs to the same company
    if (req.user!.companyId) {
      const targetUser = await prisma.user.findUnique({ where: { id: userId as string }, select: { companyId: true } });
      if (!targetUser || (targetUser.companyId && targetUser.companyId !== req.user!.companyId)) {
        res.status(400).json({ message: 'User not found or does not belong to your organization' });
        return;
      }
    }

    // Check authorization: admin, OR project manager of this specific project
    const isProjectManager = req.user!.role === Role.ADMIN || (await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user!.id } },
    }))?.isProjectManager;

    if (!isProjectManager) {
      res.status(403).json({ message: 'Only admins or project managers can add members' });
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
        members: {
          include: {
            user: { select: { id: true, name: true, avatarColor: true } },
          },
        },
      },
    });

    // Notify the added user
    await notifyProjectAdded(userId as string, project!.name, projectId, req.user!.name);

    await logActivity(req.user!.id, 'ADDED_MEMBER', 'project', projectId, `Added member to project`);

    res.json({ project });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/projects/:id/members/department/:departmentId — admin/super_admin/project manager only
export const addDepartmentMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, departmentId } = req.params as { id: string; departmentId: string };
    const projectId = id;

    // Check project exists and is not archived
    const projectCheck = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectCheck) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (projectCheck.isArchived) {
      res.status(400).json({ message: 'Cannot add members to an archived project' });
      return;
    }

    // Check authorization: admin, super_admin, or project manager
    if (req.user!.role === Role.EMPLOYEE) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user!.id } },
      });
      if (!membership || !membership.isProjectManager) {
        res.status(403).json({ message: 'Only admins or project managers can add members' });
        return;
      }
    }

    // Find all users in the department
    const departmentUsers = await prisma.user.findMany({
      where: { departmentId, status: 'ACTIVE' },
      select: { id: true }
    });

    if (departmentUsers.length === 0) {
      res.status(404).json({ message: 'No active users found in this department' });
      return;
    }

    // Find existing members mapped by id
    const existingMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true }
    });
    const existingIds = new Set(existingMembers.map(m => m.userId));

    // Filter to only new users
    const newUsers = departmentUsers.filter(u => !existingIds.has(u.id));

    if (newUsers.length === 0) {
      res.status(409).json({ message: 'All active users in this department are already members' });
      return;
    }

    // Add in bulk
    await prisma.projectMember.createMany({
      data: newUsers.map(u => ({ projectId, userId: u.id })),
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, avatarColor: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatarColor: true } },
          },
        },
      },
    });

    // Notify the added users
    for (const u of newUsers) {
      if (u.id !== req.user!.id) {
        await notifyProjectAdded(u.id, project!.name, projectId, req.user!.name);
      }
    }

    await logActivity(req.user!.id, 'ADDED_DEPARTMENT_MEMBERS', 'project', projectId, `Added ${newUsers.length} members from department`);

    res.json({ project, addedCount: newUsers.length });
  } catch (error) {
    console.error('Add department members error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/projects/:id/members/:userId — admin/super_admin/project manager only
export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const projectId = id as string;
    const memberId = userId as string;

    // Check authorization: admin, OR project manager of this specific project
    const isProjectManager = req.user!.role === Role.ADMIN || (await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user!.id } },
    }))?.isProjectManager;

    if (!isProjectManager) {
      res.status(403).json({ message: 'Only admins or project managers can remove members' });
      return;
    }

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

// GET /api/projects/:id/members — list all members
export const getMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const members = await prisma.projectMember.findMany({
      where: { projectId: id as string },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarColor: true, role: true, designation: true },
        },
      },
    });

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/projects/:id/archive — admin/super_admin only
export const archiveProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectId = id as string;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: req.user!.id,
      },
    });

    await logActivity(req.user!.id, 'ARCHIVED_PROJECT', 'project', projectId, `Archived project "${project.name}"`);

    getIO().emit('project:updated', project);

    res.json({ project, message: 'Project archived' });
  } catch (error) {
    console.error('Archive project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/projects/:id/unarchive — admin/super_admin only
export const unarchiveProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const projectId = id as string;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
      },
    });

    await logActivity(req.user!.id, 'UNARCHIVED_PROJECT', 'project', projectId, `Unarchived project "${project.name}"`);

    getIO().emit('project:updated', project);

    res.json({ project, message: 'Project unarchived' });
  } catch (error) {
    console.error('Unarchive project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/projects/:id/manager — set project manager
export const setProjectManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const projectId = id as string;

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    // Remove PM flag from all current members
    await prisma.projectMember.updateMany({
      where: { projectId, isProjectManager: true },
      data: { isProjectManager: false },
    });

    // Set the new PM
    await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: userId as string } },
      data: { isProjectManager: true },
    });

    await logActivity(req.user!.id, 'SET_PROJECT_MANAGER', 'project', projectId, `Set new project manager`);

    res.json({ message: 'Project manager updated' });
  } catch (error) {
    console.error('Set project manager error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
