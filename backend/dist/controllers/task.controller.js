"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDependency = exports.addDependency = exports.createSubtask = exports.getSubtasks = exports.updateTaskPosition = exports.assignTask = exports.updateTaskStatus = exports.restoreTask = exports.getDeletedTasks = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = exports.getMyTasks = exports.getProjectTasks = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
const socket_1 = require("../config/socket");
const notification_service_1 = require("../services/notification.service");
const pagination_1 = require("../utils/pagination");
const roles_1 = require("../config/roles");
// Helper: Check if user can modify a task
const canModifyTask = (userRole, userId, task, projectManagerCheck) => {
    // Staff roles (Admin, Manager, HR) have full control over all tasks
    if (roles_1.RoleGroups.STAFF.includes(userRole))
        return 'full';
    // Creators have full control
    if (task.createdBy === userId)
        return 'full';
    // Project Managers have full control
    if (projectManagerCheck)
        return 'full';
    // Assignees have full control over their own task content and status
    if (task.assignedTo === userId)
        return 'full';
    return 'none';
};
// GET /api/projects/:id/tasks
const getProjectTasks = async (req, res, next) => {
    try {
        const id = req.params.id;
        const role = req.user.role;
        // For non-admin roles, verify membership
        if (!roles_1.RoleGroups.STAFF.includes(role)) {
            const membership = await db_1.default.projectMember.findFirst({
                where: { projectId: id, userId: req.user.id },
            });
            if (!membership) {
                res.status(403).json({ message: 'You are not a member of this project' });
                return;
            }
        }
        const tasks = await db_1.default.task.findMany({
            where: { projectId: id, parentTaskId: null, isDeleted: false },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
                customStatus: true,
                customPriority: true,
                _count: { select: { comments: true, attachments: true, subtasks: true } },
                dependsOn: { select: { id: true, blockingTaskId: true } },
                blockedBy: { select: { id: true, dependentTaskId: true } },
            },
            orderBy: [{ status: 'asc' }, { position: 'asc' }],
        });
        res.json({ tasks });
    }
    catch (error) {
        next(error);
    }
};
exports.getProjectTasks = getProjectTasks;
// GET /api/tasks/my
const getMyTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const paginationParams = (0, pagination_1.parsePagination)(req.query);
        const [tasks, total] = await Promise.all([
            db_1.default.task.findMany({
                where: { assignedTo: userId, isDeleted: false }, // Include subtasks for assigned view
                include: {
                    project: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                    creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
                    customStatus: true,
                    customPriority: true,
                    _count: { select: { comments: true, attachments: true, subtasks: true } },
                },
                orderBy: { dueDate: 'asc' },
                skip: paginationParams.skip,
                take: paginationParams.take,
            }),
            db_1.default.task.count({ where: { assignedTo: userId } })
        ]);
        res.json({
            ...(0, pagination_1.paginatedResponse)(tasks, total, paginationParams),
            tasks // for frontend compatibility
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTasks = getMyTasks;
// GET /api/tasks
const getTasks = async (req, res, next) => {
    try {
        const { assignedTo, projectId, status, priority, isDeleted } = req.query;
        const paginationParams = (0, pagination_1.parsePagination)(req.query);
        const where = {
            isDeleted: isDeleted === 'true',
            // If filtering by project or assignee, we might want to see subtasks too
            // But if it's a general list, we only want top-level
            parentTaskId: (projectId || assignedTo) ? undefined : null,
            // TENANT ISOLATION: scope to user's company via project
            ...(req.user.companyId ? { project: { companyId: req.user.companyId } } : {}),
        };
        if (assignedTo)
            where.assignedTo = assignedTo;
        if (projectId)
            where.projectId = projectId;
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        const [tasks, total] = await Promise.all([
            db_1.default.task.findMany({
                where,
                include: {
                    project: { select: { id: true, name: true } },
                    assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                    creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
                    customStatus: true,
                    customPriority: true,
                    _count: { select: { comments: true, attachments: true, subtasks: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip: paginationParams.skip,
                take: paginationParams.take,
            }),
            db_1.default.task.count({ where })
        ]);
        res.json({
            ...(0, pagination_1.paginatedResponse)(tasks, total, paginationParams),
            tasks
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTasks = getTasks;
// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
    try {
        const id = req.params.id;
        console.log(`[TASKS] getTaskById called for ID: ${id} by User: ${req.user.id} (Role: ${req.user.role})`);
        const task = await db_1.default.task.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, name: true, email: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, email: true, avatarColor: true, designation: true } },
                project: { select: { id: true, name: true } },
                comments: {
                    include: { user: { select: { id: true, name: true, avatarColor: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                attachments: {
                    include: { uploader: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                subtasks: {
                    include: {
                        assignee: { select: { id: true, name: true, avatarColor: true } },
                    },
                    orderBy: { position: 'asc' },
                },
                dependsOn: {
                    include: {
                        blockingTask: { select: { id: true, title: true, status: true } },
                    },
                },
            },
        });
        if (!task || task.isDeleted) {
            console.log(`[TASKS] Task with ID ${id} not found or deleted`);
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // TENANT ISOLATION: verify task's project belongs to user's company
        const project = await db_1.default.project.findUnique({ where: { id: task.projectId }, select: { companyId: true } });
        if (req.user.companyId && project?.companyId && project.companyId !== req.user.companyId) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Calculate permission level for the current user
        const isProjectManager = await db_1.default.projectMember.findFirst({
            where: { projectId: task.projectId, userId: req.user.id, isProjectManager: true },
        });
        const permissionLevel = canModifyTask(req.user.role, req.user.id, task, !!isProjectManager);
        console.log(`[TASKS] Permission level for ${req.user.id} on task ${id}: ${permissionLevel}`);
        res.json({ task, permissionLevel });
    }
    catch (error) {
        next(error);
    }
};
exports.getTaskById = getTaskById;
// POST /api/projects/:id/tasks
const createTask = async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const { title, description, assignedTo, status, dueDate, priority, customFields, recurringRule } = req.body;
        if (!title || !dueDate) {
            res.status(400).json({ message: 'Title and due date are required' });
            return;
        }
        // Check project is not archived
        const project = await db_1.default.project.findUnique({ where: { id: projectId } });
        if (!project || project.isDeleted) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }
        if (project.isArchived) {
            res.status(400).json({ message: 'Cannot create tasks in an archived project' });
            return;
        }
        // Verify task due date is not after project deadline
        if (dueDate && project.deadline) {
            const taskDate = new Date(dueDate);
            const projectDate = new Date(project.deadline);
            if (taskDate > projectDate) {
                res.status(400).json({
                    message: `Task due date (${taskDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`,
                    error: 'DEADLINE_EXCEEDED'
                });
                return;
            }
        }
        // Check membership for non-admins
        const role = req.user.role;
        if (!roles_1.RoleGroups.STAFF.includes(role)) {
            const membership = await db_1.default.projectMember.findFirst({
                where: { projectId, userId: req.user.id },
            });
            if (!membership) {
                res.status(403).json({ message: 'You are not a member of this project' });
                return;
            }
        }
        // Get the max position in this project for the given status
        const maxPosition = await db_1.default.task.findFirst({
            where: { projectId, status: 'pending', parentTaskId: null },
            orderBy: { position: 'desc' },
            select: { position: true },
        });
        // Non-admin/super_admin users can only assign tasks to themselves  
        let finalAssignedTo = assignedTo;
        if (req.user.role === roles_1.Role.EMPLOYEE) {
            // Check if user is a project manager
            const isPM = await db_1.default.projectMember.findFirst({
                where: { projectId, userId: req.user.id, isProjectManager: true },
            });
            if (!isPM) {
                finalAssignedTo = req.user.id;
            }
        }
        // Map to custom status if company uses dynamic workflows
        let finalCustomStatusId = req.body.customStatusId || null;
        let finalCustomPriorityId = req.body.customPriorityId || null;
        if (req.user.companyId && !finalCustomStatusId) {
            const defaultStatus = await db_1.default.customTaskStatus.findFirst({
                where: { companyId: req.user.companyId, isDefault: true, name: 'To Do' }
            }) || await db_1.default.customTaskStatus.findFirst({
                where: { companyId: req.user.companyId },
                orderBy: { orderIndex: 'asc' }
            });
            if (defaultStatus)
                finalCustomStatusId = defaultStatus.id;
        }
        if (req.user.companyId && !finalCustomPriorityId) {
            const defaultPriority = await db_1.default.customTaskPriority.findFirst({
                where: { companyId: req.user.companyId, name: 'Medium' }
            });
            if (defaultPriority)
                finalCustomPriorityId = defaultPriority.id;
        }
        const task = await db_1.default.task.create({
            data: {
                title,
                description,
                projectId,
                companyId: req.user.companyId,
                createdBy: req.user.id,
                assignedTo: finalAssignedTo || null,
                status: status || 'pending',
                customStatusId: finalCustomStatusId,
                priority: priority || 'medium',
                customPriorityId: finalCustomPriorityId,
                dueDate: dueDate ? new Date(dueDate) : null,
                position: (maxPosition?.position ?? -1) + 1,
                customFields: customFields || undefined,
                recurringRule: recurringRule || null,
            },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
                customStatus: true,
                customPriority: true
            },
        });
        // Notify assignee
        if (task.assignedTo && task.assignedTo !== req.user.id) {
            await (0, notification_service_1.notifyTaskAssigned)(task.assignedTo, task.title, task.id, projectId, req.user.name);
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'CREATED_TASK', 'task', task.id, `Created task "${task.title}" in project`);
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${projectId}`).emit('task:created', task);
        res.status(201).json({ task });
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
// PUT /api/tasks/:id — full edit
const updateTask = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { title, description, dueDate, priority, assignedTo, status, position, customFields, recurringRule, customStatusId, customPriorityId } = req.body;
        const existingTask = await db_1.default.task.findUnique({ where: { id } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // TENANT ISOLATION: verify task's project belongs to user's company
        const taskProject = await db_1.default.project.findUnique({ where: { id: existingTask.projectId }, select: { companyId: true } });
        if (req.user.companyId && taskProject?.companyId && taskProject.companyId !== req.user.companyId) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Check task ownership
        const isProjectManager = await db_1.default.projectMember.findFirst({
            where: { projectId: existingTask.projectId, userId: req.user.id, isProjectManager: true },
        });
        const permission = canModifyTask(req.user.role, req.user.id, existingTask, !!isProjectManager);
        if (permission === 'none') {
            res.status(403).json({ message: 'Not authorized to update this task' });
            return;
        }
        // Verify task due date is not after project deadline
        const project = await db_1.default.project.findUnique({ where: { id: existingTask.projectId } });
        if (dueDate && project?.deadline) {
            const taskDate = new Date(dueDate);
            const projectDate = new Date(project.deadline);
            if (taskDate > projectDate) {
                res.status(400).json({
                    message: `Task due date (${taskDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`,
                    error: 'DEADLINE_EXCEEDED'
                });
                return;
            }
        }
        if (permission === 'status_only') {
            // Basic assignees can only update status
            if (title || description || dueDate || priority || assignedTo || position !== undefined || customFields !== undefined) {
                res.status(403).json({ message: 'You can only update the status of this task' });
                return;
            }
        }
        // Legacy assignee_edit block removed as assignees now have full content edit rights
        // but assignment restrictions still apply below.
        // Non-admin/PM cannot reassign tasks to others
        let finalAssignedTo = assignedTo;
        if (req.user.role === roles_1.Role.EMPLOYEE && !isProjectManager && assignedTo && assignedTo !== req.user.id) {
            finalAssignedTo = existingTask.assignedTo;
        }
        // Sync standard status with custom status category if custom status is provided
        let finalStatus = status;
        if (customStatusId) {
            const customStatus = await db_1.default.customTaskStatus.findUnique({ where: { id: customStatusId } });
            if (customStatus) {
                finalStatus = customStatus.standardStatus;
            }
        }
        const task = await db_1.default.task.update({
            where: { id },
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                priority,
                assignedTo: finalAssignedTo,
                status: finalStatus,
                customStatusId: customStatusId !== undefined ? customStatusId : undefined,
                customPriorityId: customPriorityId !== undefined ? customPriorityId : undefined,
                position,
                customFields,
                recurringRule: recurringRule !== undefined ? (recurringRule || null) : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
                customStatus: true,
                customPriority: true
            },
        });
        // Notify on assignment change
        if (assignedTo && assignedTo !== existingTask.assignedTo && assignedTo !== req.user.id) {
            await (0, notification_service_1.notifyTaskAssigned)(assignedTo, task.title, task.id, task.projectId, req.user.name);
        }
        // Notify on status change
        if (status && status !== existingTask.status) {
            // Notify creator if they're not the one changing it
            if (existingTask.createdBy !== req.user.id) {
                await (0, notification_service_1.notifyStatusChanged)(existingTask.createdBy, task.title, task.id, task.projectId, status, req.user.name);
            }
            // Notify assignee if they're not the one changing it
            if (existingTask.assignedTo && existingTask.assignedTo !== req.user.id) {
                await (0, notification_service_1.notifyStatusChanged)(existingTask.assignedTo, task.title, task.id, task.projectId, status, req.user.name);
            }
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'UPDATED_TASK', 'task', task.id, `Updated task "${task.title}"`);
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('task:updated', task);
        res.json({ task });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
    try {
        const id = req.params.id;
        const task = await db_1.default.task.findUnique({ where: { id } });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // TENANT ISOLATION: verify task's project belongs to user's company
        const delTaskProject = await db_1.default.project.findUnique({ where: { id: task.projectId }, select: { companyId: true } });
        if (req.user.companyId && delTaskProject?.companyId && delTaskProject.companyId !== req.user.companyId) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Check task ownership
        const isProjectManager = await db_1.default.projectMember.findFirst({
            where: { projectId: task.projectId, userId: req.user.id, isProjectManager: true },
        });
        const permission = canModifyTask(req.user.role, req.user.id, task, !!isProjectManager);
        if (permission !== 'full') {
            res.status(403).json({ message: 'Not authorized to delete this task' });
            return;
        }
        const projectId = task.projectId;
        await db_1.default.task.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'DELETED_TASK', 'task', id, `Deleted task "${task.title}"`);
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${projectId}`).emit('task:deleted', id);
        res.json({ message: 'Task deleted' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTask = deleteTask;
// GET /api/tasks/deleted — admin only
const getDeletedTasks = async (req, res, next) => {
    try {
        const tasks = await db_1.default.task.findMany({
            where: {
                isDeleted: true,
                ...(req.user?.companyId ? { project: { companyId: req.user.companyId } } : {})
            },
            include: {
                project: { select: { id: true, name: true } },
                assignee: { select: { id: true, name: true, avatarColor: true } },
            },
            orderBy: { deletedAt: 'desc' },
        });
        res.json({ tasks });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeletedTasks = getDeletedTasks;
// PATCH /api/tasks/:id/restore — admin only
const restoreTask = async (req, res, next) => {
    try {
        const id = req.params.id;
        const task = await db_1.default.task.findUnique({ where: { id } });
        if (!task || !task.isDeleted) {
            res.status(404).json({ message: 'Deleted task not found' });
            return;
        }
        await db_1.default.task.update({
            where: { id },
            data: { isDeleted: false, deletedAt: null },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'RESTORED_TASK', 'task', id, `Restored task "${task.title}"`);
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('task:created', task);
        res.json({ message: 'Task restored' });
    }
    catch (error) {
        next(error);
    }
};
exports.restoreTask = restoreTask;
// PATCH /api/tasks/:id/status — assignee or creator or admin can update
const updateTaskStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['pending', 'ongoing', 'in_review', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }
        const existingTask = await db_1.default.task.findUnique({ where: { id } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Check permission: creator, assignee, admin, super_admin, or PM
        const isProjectManager = await db_1.default.projectMember.findFirst({
            where: { projectId: existingTask.projectId, userId: req.user.id, isProjectManager: true },
        });
        const permission = canModifyTask(req.user.role, req.user.id, existingTask, !!isProjectManager);
        if (permission === 'none') {
            res.status(403).json({ message: 'Not authorized to update this task status' });
            return;
        }
        // Task dependency enforcement
        if (status === 'completed' || status === 'in_review') {
            const blockingDependencies = await db_1.default.taskDependency.findMany({
                where: { dependentTaskId: id },
                include: { blockingTask: true },
            });
            const uncompletedBlockers = blockingDependencies.filter(d => d.blockingTask.status !== 'completed');
            if (uncompletedBlockers.length > 0) {
                res.status(400).json({
                    message: 'Cannot update status. This task is blocked by pending tasks.',
                    uncompletedBlockers: uncompletedBlockers.map(d => d.blockingTask.title)
                });
                return;
            }
        }
        const task = await db_1.default.task.update({
            where: { id },
            data: { status },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
            },
        });
        // Notifications
        if (existingTask.createdBy !== req.user.id) {
            await (0, notification_service_1.notifyStatusChanged)(existingTask.createdBy, task.title, task.id, task.projectId, status, req.user.name);
        }
        if (existingTask.assignedTo && existingTask.assignedTo !== req.user.id) {
            await (0, notification_service_1.notifyStatusChanged)(existingTask.assignedTo, task.title, task.id, task.projectId, status, req.user.name);
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'CHANGED_STATUS', 'task', task.id, `Changed task "${task.title}" status to ${status}`);
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('task:updated', task);
        res.json({ task });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskStatus = updateTaskStatus;
// PATCH /api/tasks/:id/assign — self-assign or admin/PM reassign
const assignTask = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { assignedTo } = req.body;
        const existingTask = await db_1.default.task.findUnique({ where: { id } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Non-admin can only assign to themselves (unless PM)
        if (req.user.role === roles_1.Role.EMPLOYEE) {
            const isPM = await db_1.default.projectMember.findFirst({
                where: { projectId: existingTask.projectId, userId: req.user.id, isProjectManager: true },
            });
            if (!isPM && assignedTo && assignedTo !== req.user.id) {
                res.status(403).json({ message: 'You can only assign tasks to yourself' });
                return;
            }
        }
        const task = await db_1.default.task.update({
            where: { id },
            data: { assignedTo: assignedTo || req.user.id },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
            },
        });
        // Notify new assignee
        const finalAssignee = assignedTo || req.user.id;
        if (finalAssignee !== req.user.id) {
            await (0, notification_service_1.notifyTaskAssigned)(finalAssignee, task.title, task.id, task.projectId, req.user.name);
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'ASSIGNED_TASK', 'task', task.id, `Assigned task "${task.title}"`);
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('task:updated', task);
        res.json({ task });
    }
    catch (error) {
        next(error);
    }
};
exports.assignTask = assignTask;
// PATCH /api/tasks/:id/position — kanban drag position
const updateTaskPosition = async (req, res, next) => {
    try {
        const id = req.params.id;
        let { status, position, customStatusId } = req.body;
        // Handle being passed a UUID for status (i.e. custom workflow status from Kanban)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(status);
        if (isUUID) {
            customStatusId = status;
            const customStatus = await db_1.default.customTaskStatus.findUnique({ where: { id: customStatusId } });
            status = customStatus?.standardStatus || 'ongoing';
        }
        const existingTask = await db_1.default.task.findUnique({ where: { id } });
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Check permission for moving tasks (status change)
        const isProjectManager = await db_1.default.projectMember.findFirst({
            where: { projectId: existingTask.projectId, userId: req.user.id, isProjectManager: true },
        });
        const permission = canModifyTask(req.user.role, req.user.id, existingTask, !!isProjectManager);
        if (permission === 'none') {
            res.status(403).json({ message: 'Not authorized to move this task' });
            return;
        }
        const task = await db_1.default.task.update({
            where: { id },
            data: {
                status,
                position,
                customStatusId: customStatusId !== undefined ? customStatusId : undefined
            },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true, designation: true } },
                creator: { select: { id: true, name: true, avatarColor: true, designation: true } },
                customStatus: true,
                customPriority: true
            },
        });
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('task:updated', task);
        res.json({ task });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskPosition = updateTaskPosition;
// --- Subtask endpoints ---
// GET /api/tasks/:id/subtasks
const getSubtasks = async (req, res, next) => {
    try {
        const parentId = req.params.id;
        const subtasks = await db_1.default.task.findMany({
            where: { parentTaskId: parentId },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true } },
            },
            orderBy: { position: 'asc' },
        });
        res.json({ subtasks });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubtasks = getSubtasks;
// POST /api/tasks/:id/subtasks
const createSubtask = async (req, res, next) => {
    try {
        const parentId = req.params.id;
        const { title, assignedTo, dueDate, priority, customFields } = req.body;
        if (!title) {
            res.status(400).json({ message: 'Subtask title is required' });
            return;
        }
        const parentTask = await db_1.default.task.findUnique({
            where: { id: parentId },
            include: { project: true }
        });
        if (!parentTask) {
            res.status(404).json({ message: 'Parent task not found' });
            return;
        }
        // Verify subtask due date is not after project deadline
        const project = parentTask.project;
        if (dueDate && project.deadline) {
            const subtaskDate = new Date(dueDate);
            const projectDate = new Date(project.deadline);
            if (subtaskDate > projectDate) {
                res.status(400).json({
                    message: `Subtask due date (${subtaskDate.toLocaleDateString()}) cannot be after project deadline (${projectDate.toLocaleDateString()})`
                });
                return;
            }
        }
        // Get max position among existing subtasks
        const maxPos = await db_1.default.task.findFirst({
            where: { parentTaskId: parentId },
            orderBy: { position: 'desc' },
            select: { position: true },
        });
        const subtask = await db_1.default.task.create({
            data: {
                title,
                projectId: parentTask.projectId,
                createdBy: req.user.id,
                assignedTo: req.user.role === roles_1.Role.EMPLOYEE ? req.user.id : (assignedTo || null),
                parentTaskId: parentId,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority || 'medium',
                position: (maxPos?.position ?? -1) + 1,
                customFields: customFields || undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, avatarColor: true } },
            },
        });
        // Notify assignee
        if (subtask.assignedTo && subtask.assignedTo !== req.user.id) {
            await (0, notification_service_1.notifyTaskAssigned)(subtask.assignedTo, subtask.title, subtask.id, parentTask.projectId, req.user.name);
        }
        await (0, activity_service_1.logActivity)(req.user.id, 'CREATED_SUBTASK', 'task', subtask.id, `Created subtask "${subtask.title}"`);
        res.status(201).json({ subtask });
    }
    catch (error) {
        next(error);
    }
};
exports.createSubtask = createSubtask;
// POST /api/tasks/:id/dependencies
const addDependency = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { blockingTaskId } = req.body;
        if (id === blockingTaskId) {
            res.status(400).json({ message: 'Task cannot depend on itself' });
            return;
        }
        const task = await db_1.default.task.findUnique({ where: { id } });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // --- Circular Dependency Detection (BFS, max 20 hops) ---
        // We check: would adding (blockingTaskId → id) create a cycle?
        // i.e., is `id` already reachable FROM `blockingTaskId` through existing dependencies?
        const visited = new Set();
        const queue = [id]; // start from the dependent task
        const MAX_DEPTH = 20;
        let depth = 0;
        while (queue.length > 0 && depth < MAX_DEPTH) {
            const current = queue.shift();
            if (visited.has(current))
                continue;
            visited.add(current);
            // If we reach blockingTaskId while traversing from id, it means id already
            // blocks blockingTaskId, creating a cycle if we add blockingTaskId → id.
            if (current === blockingTaskId) {
                res.status(400).json({ message: 'Circular dependency detected. This would create an infinite dependency loop.' });
                return;
            }
            // Find all tasks that `current` blocks (i.e. current is a blocking task for these)
            const outgoing = await db_1.default.taskDependency.findMany({
                where: { blockingTaskId: current },
                select: { dependentTaskId: true },
            });
            for (const dep of outgoing) {
                if (!visited.has(dep.dependentTaskId)) {
                    queue.push(dep.dependentTaskId);
                }
            }
            depth++;
        }
        // --- End Circular Dependency Detection ---
        const dependency = await db_1.default.taskDependency.create({
            data: {
                dependentTaskId: id,
                blockingTaskId
            },
            include: {
                blockingTask: { select: { id: true, title: true, status: true } }
            }
        });
        res.status(201).json({ message: 'Dependency added', dependency });
    }
    catch (error) {
        console.error('Add dependency error:', error);
        res.status(500).json({ message: 'Failed to add dependency. It may already exist.' });
    }
};
exports.addDependency = addDependency;
// DELETE /api/tasks/:id/dependencies/:blockingTaskId
const removeDependency = async (req, res, next) => {
    try {
        const id = req.params.id;
        const blockingTaskId = req.params.blockingTaskId;
        await db_1.default.taskDependency.delete({
            where: {
                dependentTaskId_blockingTaskId: {
                    dependentTaskId: id,
                    blockingTaskId: blockingTaskId,
                }
            }
        });
        res.json({ message: 'Dependency removed' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Dependency not found' });
            return;
        }
        res.status(500).json({ message: 'Failed to remove dependency' });
    }
};
exports.removeDependency = removeDependency;
//# sourceMappingURL=task.controller.js.map