"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setProjectManager = exports.unarchiveProject = exports.archiveProject = exports.getMembers = exports.removeMember = exports.addDepartmentMembers = exports.addMember = exports.restoreProject = exports.getDeletedProjects = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getCategories = exports.getProjects = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
const socket_1 = require("../config/socket");
const notification_service_1 = require("../services/notification.service");
const pagination_1 = require("../utils/pagination");
const roles_1 = require("../config/roles");
// GET /api/projects
const getProjects = async (req, res) => {
    try {
        const showArchived = req.query.archived === 'true';
        const category = req.query.category;
        const status = req.query.status;
        const search = req.query.search;
        const managerId = req.query.managerId;
        const deadline = req.query.deadline;
        const where = {};
        // Filter archived
        where.isArchived = showArchived;
        // Always exclude soft-deleted projects
        where.isDeleted = false;
        // Filter by category
        if (category)
            where.category = category;
        // Filter by status
        if (status)
            where.status = status;
        // Search by name
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        // Filter by manager (owner)
        if (managerId) {
            where.ownerId = managerId;
        }
        // Filter by deadline
        if (deadline) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (deadline === 'today') {
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                where.deadline = { gte: now, lt: tomorrow };
            }
            else if (deadline === 'this-week') {
                const endOfWeek = new Date(now);
                endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
                where.deadline = { gte: now, lte: endOfWeek };
            }
            else if (deadline === 'overdue') {
                where.deadline = { lt: now };
                where.status = { not: 'completed' };
            }
        }
        const userId = req.user.id;
        const role = req.user.role;
        const isPrivileged = roles_1.RoleGroups.STAFF.includes(role);
        // Non-privileged users (employees) only see projects they are a member of
        if (!isPrivileged) {
            where.members = { some: { userId } };
        }
        const paginationParams = (0, pagination_1.parsePagination)(req.query);
        const [projects, total] = await Promise.all([
            db_1.default.project.findMany({
                where,
                include: {
                    owner: { select: { id: true, name: true, avatarColor: true } },
                    members: {
                        include: {
                            user: { select: { id: true, name: true, avatarColor: true } },
                        },
                    },
                    _count: { select: { tasks: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: paginationParams.skip,
                take: paginationParams.take,
            }),
            db_1.default.project.count({ where }),
        ]);
        // Add progress percentage and isMember flag
        const projectsWithProgress = await Promise.all(projects.map(async (project) => {
            const totalTasks = await db_1.default.task.count({
                where: { projectId: project.id, parentTaskId: null, isDeleted: false },
            });
            const completedTasks = await db_1.default.task.count({
                where: { projectId: project.id, status: 'completed', parentTaskId: null, isDeleted: false },
            });
            const isMember = project.members.some((m) => m.userId === req.user.id);
            const isProjectManager = project.members.some((m) => m.userId === req.user.id && m.isProjectManager);
            return {
                ...project,
                progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                totalTasks,
                completedTasks,
                isMember,
                isProjectManager,
            };
        }));
        res.json({
            ...(0, pagination_1.paginatedResponse)(projectsWithProgress, total, paginationParams),
            // Keep 'projects' root key for existing frontend
            projects: projectsWithProgress
        });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjects = getProjects;
// GET /api/projects/categories — get distinct categories
const getCategories = async (req, res) => {
    try {
        const categories = await db_1.default.project.findMany({
            where: { category: { not: null } },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
        });
        res.json({ categories: categories.map((c) => c.category).filter(Boolean) });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getCategories = getCategories;
// GET /api/projects/:id
const getProjectById = async (req, res) => {
    try {
        const project = await db_1.default.project.findUnique({
            where: { id: req.params.id },
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
        const isMember = project.members.some((m) => m.userId === req.user.id);
        const isProjectManager = project.members.some((m) => m.userId === req.user.id && m.isProjectManager);
        const isPrivileged = roles_1.RoleGroups.STAFF.includes(req.user.role);
        if (!isPrivileged && !isMember) {
            res.status(403).json({ message: 'You are not a member of this project' });
            return;
        }
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t) => t.status === 'completed').length;
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
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getProjectById = getProjectById;
// POST /api/projects — admin/super_admin only
const createProject = async (req, res) => {
    try {
        const { name, description, status, startDate, deadline, memberIds, // Individual user IDs
        category, templateId, clientId, departmentId, // Primary department
        otherDepartmentIds, // Additional departments
        projectManagerId // Explicitly chosen PM
         } = req.body;
        if (!name || !category || !startDate || !deadline) {
            res.status(400).json({ message: 'Project name, category, start date, and deadline are required' });
            return;
        }
        // Verify deadline is not before start date
        if (new Date(deadline) < new Date(startDate)) {
            res.status(400).json({ message: 'Project deadline cannot be before the start date' });
            return;
        }
        let defaultTasks = [];
        let defaultMilestones = [];
        if (templateId) {
            const template = await db_1.default.projectTemplate.findUnique({ where: { id: templateId } });
            if (template) {
                if (Array.isArray(template.tasks)) {
                    defaultTasks = template.tasks.map((t, index) => ({
                        title: t.title,
                        description: t.description || '',
                        priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium',
                        createdBy: req.user.id,
                        position: index * 1024,
                        status: 'pending' // Default status for new tasks
                    }));
                }
                if (Array.isArray(template.milestones)) {
                    defaultMilestones = template.milestones.map((m) => ({
                        title: m.title,
                        description: m.description || '',
                        status: 'pending'
                    }));
                }
            }
        }
        // --- Member Auto-Assignment Logic ---
        const allMemberIdsSet = new Set(memberIds || []);
        let finalProjectManagerId = projectManagerId || req.user.id;
        // 1. Get users from Primary Department
        let primaryDeptManagerId = null;
        if (departmentId) {
            const primaryDept = await db_1.default.department.findUnique({
                where: { id: departmentId },
                include: { users: { select: { id: true } } }
            });
            if (primaryDept) {
                primaryDept.users.forEach(u => allMemberIdsSet.add(u.id));
                primaryDeptManagerId = primaryDept.managerId;
            }
        }
        // 2. Get users from Other Departments
        if (otherDepartmentIds && otherDepartmentIds.length > 0) {
            const otherDeptsUsers = await db_1.default.user.findMany({
                where: { departmentId: { in: otherDepartmentIds }, status: 'ACTIVE' },
                select: { id: true }
            });
            otherDeptsUsers.forEach(u => allMemberIdsSet.add(u.id));
        }
        // 3. Determine Project Manager
        // Priority: Explicitly chosen PM > Primary Dept Manager > Project Creator
        if (!projectManagerId) {
            if (primaryDeptManagerId) {
                finalProjectManagerId = primaryDeptManagerId;
            }
        }
        // Ensure the PM and the creator are in the members set
        allMemberIdsSet.add(req.user.id);
        allMemberIdsSet.add(finalProjectManagerId);
        const finalMemberIds = Array.from(allMemberIdsSet);
        // --- End of Member Logic ---
        const project = await db_1.default.project.create({
            data: {
                name,
                description,
                status: status || 'planning',
                category: category || null,
                startDate: startDate ? new Date(startDate) : null,
                deadline: deadline ? new Date(deadline) : null,
                ownerId: req.user.id,
                clientId: clientId || null,
                departmentId: departmentId || null,
                members: {
                    create: finalMemberIds.map((userId) => ({
                        userId,
                        isProjectManager: userId === finalProjectManagerId
                    })),
                },
                tasks: defaultTasks.length > 0 ? { create: defaultTasks } : undefined,
                milestones: defaultMilestones.length > 0 ? { create: defaultMilestones } : undefined,
            },
            include: {
                owner: { select: { id: true, name: true, avatarColor: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatarColor: true } },
                    },
                },
            },
        });
        // Notify added members
        if (finalMemberIds.length > 0) {
            for (const memberId of finalMemberIds) {
                if (memberId !== req.user.id) {
                    await (0, notification_service_1.notifyProjectAdded)(memberId, project.name, project.id, req.user.name);
                }
            }
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'CREATED_PROJECT', 'project', project.id, `Created project "${project.name}"`);
        // Emit socket event for all clients
        (0, socket_1.getIO)().emit('project:created', project);
        res.status(201).json({ project: { ...project, progress: 0, totalTasks: 0, completedTasks: 0 } });
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createProject = createProject;
// PUT /api/projects/:id — admin/super_admin only
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status, startDate, deadline, category, ownerId, clientId } = req.body;
        const projectId = id;
        // Check if archived
        const existing = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!existing) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        if (existing.isArchived || existing.isDeleted) {
            res.status(400).json({ message: 'Cannot update an archived or deleted project' });
            return;
        }
        // Only super_admin can change ownerId
        const updateData = {
            name,
            description,
            status,
            category,
            startDate: startDate ? new Date(startDate) : undefined,
            deadline: deadline ? new Date(deadline) : undefined,
            clientId: clientId !== undefined ? (clientId || null) : undefined,
        };
        if (ownerId && req.user.role === roles_1.Role.ADMIN) {
            updateData.ownerId = ownerId;
            // Also ensure the new owner is a project manager in the members table
            await db_1.default.projectMember.upsert({
                where: { projectId_userId: { projectId, userId: ownerId } },
                create: { projectId, userId: ownerId, isProjectManager: true },
                update: { isProjectManager: true },
            });
        }
        const project = await db_1.default.project.update({
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
        await (0, activity_service_1.logActivity)(req.user.id, 'UPDATED_PROJECT', 'project', project.id, `Updated project "${project.name}"`);
        // Notify all members about the project update
        const memberIds = project.members.map(m => m.userId);
        for (const memberId of memberIds) {
            if (memberId !== req.user.id) {
                let updateDesc = 'General details updated';
                if (status && status !== existing.status)
                    updateDesc = `Status changed to ${status}`;
                else if (deadline && new Date(deadline).getTime() !== existing.deadline?.getTime())
                    updateDesc = `Deadline updated to ${new Date(deadline).toLocaleDateString()}`;
                await (0, notification_service_1.notifyProjectUpdated)(memberId, project.name, project.id, updateDesc, req.user.name);
            }
        }
        // Emit to ALL clients since dashboard/project lists need to update
        (0, socket_1.getIO)().emit('project:updated', project);
        res.json({ project });
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateProject = updateProject;
// DELETE /api/projects/:id — admin/super_admin only
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = id;
        const project = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        await db_1.default.project.update({
            where: { id: projectId },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'DELETED_PROJECT', 'project', projectId, `Deleted project "${project.name}"`);
        // Emit general deletion alert
        (0, socket_1.getIO)().emit('project:deleted', projectId);
        res.json({ message: 'Project deleted' });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteProject = deleteProject;
// GET /api/projects/deleted — admin only
const getDeletedProjects = async (req, res) => {
    try {
        const projects = await db_1.default.project.findMany({
            where: { isDeleted: true },
            include: {
                owner: { select: { id: true, name: true, avatarColor: true } },
            },
            orderBy: { deletedAt: 'desc' },
        });
        res.json({ projects });
    }
    catch (error) {
        console.error('Get deleted projects error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDeletedProjects = getDeletedProjects;
// PATCH /api/projects/:id/restore — admin only
const restoreProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = id;
        const project = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!project || !project.isDeleted) {
            res.status(404).json({ message: 'Deleted project not found' });
            return;
        }
        await db_1.default.project.update({
            where: { id: projectId },
            data: { isDeleted: false, deletedAt: null },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'RESTORED_PROJECT', 'project', projectId, `Restored project "${project.name}"`);
        // We can emit project:created here or a generic updated event to refresh lists
        (0, socket_1.getIO)().emit('project:updated', project);
        res.json({ message: 'Project restored' });
    }
    catch (error) {
        console.error('Restore project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.restoreProject = restoreProject;
// POST /api/projects/:id/members — admin/super_admin/project manager only
const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const projectId = id;
        if (!userId) {
            res.status(400).json({ message: 'userId is required' });
            return;
        }
        // Check project exists and is not archived
        const projectCheck = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!projectCheck) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        if (projectCheck.isArchived) {
            res.status(400).json({ message: 'Cannot add members to an archived project' });
            return;
        }
        // Check authorization: admin, OR project manager of this specific project
        const isProjectManager = req.user.role === roles_1.Role.ADMIN || (await db_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: req.user.id } },
        }))?.isProjectManager;
        if (!isProjectManager) {
            res.status(403).json({ message: 'Only admins or project managers can add members' });
            return;
        }
        const existing = await db_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: userId } },
        });
        if (existing) {
            res.status(409).json({ message: 'User is already a member' });
            return;
        }
        await db_1.default.projectMember.create({
            data: { projectId, userId: userId },
        });
        const project = await db_1.default.project.findUnique({
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
        await (0, notification_service_1.notifyProjectAdded)(userId, project.name, projectId, req.user.name);
        await (0, activity_service_1.logActivity)(req.user.id, 'ADDED_MEMBER', 'project', projectId, `Added member to project`);
        res.json({ project });
    }
    catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.addMember = addMember;
// POST /api/projects/:id/members/department/:departmentId — admin/super_admin/project manager only
const addDepartmentMembers = async (req, res) => {
    try {
        const { id, departmentId } = req.params;
        const projectId = id;
        // Check project exists and is not archived
        const projectCheck = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!projectCheck) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        if (projectCheck.isArchived) {
            res.status(400).json({ message: 'Cannot add members to an archived project' });
            return;
        }
        // Check authorization: admin, super_admin, or project manager
        if (req.user.role === roles_1.Role.EMPLOYEE) {
            const membership = await db_1.default.projectMember.findUnique({
                where: { projectId_userId: { projectId, userId: req.user.id } },
            });
            if (!membership || !membership.isProjectManager) {
                res.status(403).json({ message: 'Only admins or project managers can add members' });
                return;
            }
        }
        // Find all users in the department
        const departmentUsers = await db_1.default.user.findMany({
            where: { departmentId, status: 'ACTIVE' },
            select: { id: true }
        });
        if (departmentUsers.length === 0) {
            res.status(404).json({ message: 'No active users found in this department' });
            return;
        }
        // Find existing members mapped by id
        const existingMembers = await db_1.default.projectMember.findMany({
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
        await db_1.default.projectMember.createMany({
            data: newUsers.map(u => ({ projectId, userId: u.id })),
        });
        const project = await db_1.default.project.findUnique({
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
            if (u.id !== req.user.id) {
                await (0, notification_service_1.notifyProjectAdded)(u.id, project.name, projectId, req.user.name);
            }
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'ADDED_DEPARTMENT_MEMBERS', 'project', projectId, `Added ${newUsers.length} members from department`);
        res.json({ project, addedCount: newUsers.length });
    }
    catch (error) {
        console.error('Add department members error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.addDepartmentMembers = addDepartmentMembers;
// DELETE /api/projects/:id/members/:userId — admin/super_admin/project manager only
const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const projectId = id;
        const memberId = userId;
        // Check authorization: admin, OR project manager of this specific project
        const isProjectManager = req.user.role === roles_1.Role.ADMIN || (await db_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: req.user.id } },
        }))?.isProjectManager;
        if (!isProjectManager) {
            res.status(403).json({ message: 'Only admins or project managers can remove members' });
            return;
        }
        await db_1.default.projectMember.delete({
            where: { projectId_userId: { projectId, userId: memberId } },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'REMOVED_MEMBER', 'project', projectId, `Removed member from project`);
        res.json({ message: 'Member removed' });
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.removeMember = removeMember;
// GET /api/projects/:id/members — list all members
const getMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const members = await db_1.default.projectMember.findMany({
            where: { projectId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatarColor: true, role: true, designation: true },
                },
            },
        });
        res.json({ members });
    }
    catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMembers = getMembers;
// PATCH /api/projects/:id/archive — admin/super_admin only
const archiveProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = id;
        const project = await db_1.default.project.update({
            where: { id: projectId },
            data: {
                isArchived: true,
                archivedAt: new Date(),
                archivedBy: req.user.id,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'ARCHIVED_PROJECT', 'project', projectId, `Archived project "${project.name}"`);
        (0, socket_1.getIO)().emit('project:updated', project);
        res.json({ project, message: 'Project archived' });
    }
    catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.archiveProject = archiveProject;
// PATCH /api/projects/:id/unarchive — admin/super_admin only
const unarchiveProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = id;
        const project = await db_1.default.project.update({
            where: { id: projectId },
            data: {
                isArchived: false,
                archivedAt: null,
                archivedBy: null,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'UNARCHIVED_PROJECT', 'project', projectId, `Unarchived project "${project.name}"`);
        (0, socket_1.getIO)().emit('project:updated', project);
        res.json({ project, message: 'Project unarchived' });
    }
    catch (error) {
        console.error('Unarchive project error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.unarchiveProject = unarchiveProject;
// PATCH /api/projects/:id/manager — set project manager
const setProjectManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const projectId = id;
        if (!userId) {
            res.status(400).json({ message: 'userId is required' });
            return;
        }
        // Remove PM flag from all current members
        await db_1.default.projectMember.updateMany({
            where: { projectId, isProjectManager: true },
            data: { isProjectManager: false },
        });
        // Set the new PM
        await db_1.default.projectMember.update({
            where: { projectId_userId: { projectId, userId: userId } },
            data: { isProjectManager: true },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'SET_PROJECT_MANAGER', 'project', projectId, `Set new project manager`);
        res.json({ message: 'Project manager updated' });
    }
    catch (error) {
        console.error('Set project manager error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.setProjectManager = setProjectManager;
//# sourceMappingURL=project.controller.js.map