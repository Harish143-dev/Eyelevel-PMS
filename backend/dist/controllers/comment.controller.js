"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.createComment = exports.getComments = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const notification_service_1 = require("../services/notification.service");
// GET /api/tasks/:id/comments
const getComments = async (req, res) => {
    try {
        const comments = await db_1.default.comment.findMany({
            where: { taskId: req.params.id },
            include: {
                user: { select: { id: true, name: true, avatarColor: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ comments });
    }
    catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getComments = getComments;
// POST /api/tasks/:id/comments
const createComment = async (req, res) => {
    try {
        const { content, mentions } = req.body;
        const taskId = req.params.id;
        if (!content || !content.trim()) {
            res.status(400).json({ message: 'Comment content is required' });
            return;
        }
        const task = await db_1.default.task.findUnique({
            where: { id: taskId },
            select: { projectId: true, title: true, createdBy: true, assignedTo: true },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        const comment = await db_1.default.comment.create({
            data: {
                taskId,
                userId: req.user.id,
                content: content.trim(),
            },
            include: {
                user: { select: { id: true, name: true, avatarColor: true } },
            },
        });
        const mentionedUserIds = Array.isArray(mentions) ? mentions : [];
        // Notify mentioned users
        for (const userId of mentionedUserIds) {
            if (userId !== req.user.id) {
                await (0, notification_service_1.notifyUserMentioned)(userId, task.title, taskId, task.projectId, req.user.name);
            }
        }
        // Notify task creator (if not the commenter and not mentioned)
        if (task.createdBy !== req.user.id && !mentionedUserIds.includes(task.createdBy)) {
            await (0, notification_service_1.notifyCommentAdded)(task.createdBy, task.title, taskId, task.projectId, req.user.name);
        }
        // Notify task assignee (if not the commenter, different from creator, and not mentioned)
        if (task.assignedTo && task.assignedTo !== req.user.id && task.assignedTo !== task.createdBy && !mentionedUserIds.includes(task.assignedTo)) {
            await (0, notification_service_1.notifyCommentAdded)(task.assignedTo, task.title, taskId, task.projectId, req.user.name);
        }
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('comment:created', { taskId, comment });
        res.status(201).json({ comment });
    }
    catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createComment = createComment;
// PUT /api/comments/:id
const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const existing = await db_1.default.comment.findUnique({
            where: { id: id },
            include: { task: { select: { projectId: true } } }
        });
        if (!existing) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        if (existing.userId !== req.user.id) {
            res.status(403).json({ message: 'Can only edit your own comments' });
            return;
        }
        const comment = await db_1.default.comment.update({
            where: { id: id },
            data: { content: content.trim(), isEdited: true },
            include: {
                user: { select: { id: true, name: true, avatarColor: true } },
            },
        });
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${existing.task.projectId}`).emit('comment:updated', { taskId: comment.taskId, comment });
        res.json({ comment });
    }
    catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateComment = updateComment;
// DELETE /api/comments/:id
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db_1.default.comment.findUnique({
            where: { id: id },
            include: { task: { select: { projectId: true } } }
        });
        if (!existing) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        // Owner of the comment or admin/super_admin can delete
        if (existing.userId !== req.user.id && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized to delete this comment' });
            return;
        }
        await db_1.default.comment.delete({ where: { id: id } });
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${existing.task.projectId}`).emit('comment:deleted', { taskId: existing.taskId, commentId: id });
        res.json({ message: 'Comment deleted' });
    }
    catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=comment.controller.js.map