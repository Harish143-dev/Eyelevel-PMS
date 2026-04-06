"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAttachment = exports.downloadAttachment = exports.uploadAttachment = exports.getAttachments = void 0;
const fs_1 = __importDefault(require("fs"));
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
// GET /api/tasks/:id/attachments
const getAttachments = async (req, res) => {
    try {
        const attachments = await db_1.default.attachment.findMany({
            where: { taskId: req.params.id },
            include: {
                uploader: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ attachments });
    }
    catch (error) {
        console.error('Get attachments error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAttachments = getAttachments;
// POST /api/tasks/:id/attachments
const uploadAttachment = async (req, res) => {
    try {
        const taskId = req.params.id;
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const task = await db_1.default.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        const attachment = await db_1.default.attachment.create({
            data: {
                taskId,
                uploadedBy: req.user.id,
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
            },
            include: {
                uploader: { select: { id: true, name: true } },
            },
        });
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${task.projectId}`).emit('attachment:uploaded', { taskId, attachment });
        res.status(201).json({ attachment });
    }
    catch (error) {
        console.error('Upload attachment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.uploadAttachment = uploadAttachment;
// GET /api/attachments/:id/download
const downloadAttachment = async (req, res) => {
    try {
        const attachment = await db_1.default.attachment.findUnique({
            where: { id: req.params.id },
        });
        if (!attachment) {
            res.status(404).json({ message: 'Attachment not found' });
            return;
        }
        res.download(attachment.filePath, attachment.fileName);
    }
    catch (error) {
        console.error('Download attachment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.downloadAttachment = downloadAttachment;
// DELETE /api/attachments/:id
const deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await db_1.default.attachment.findUnique({
            where: { id: id },
            include: { task: { select: { projectId: true } } }
        });
        if (!attachment) {
            res.status(404).json({ message: 'Attachment not found' });
            return;
        }
        // Only uploader or admin can delete
        if (attachment.uploadedBy !== req.user.id && req.user.role !== 'manager') {
            res.status(403).json({ message: 'Not authorized to delete this file' });
            return;
        }
        // Delete file from disk
        try {
            if (fs_1.default.existsSync(attachment.filePath)) {
                fs_1.default.unlinkSync(attachment.filePath);
            }
        }
        catch (fsError) {
            console.error('File deletion error:', fsError);
        }
        await db_1.default.attachment.delete({ where: { id: id } });
        // Emit socket event
        (0, socket_1.getIO)().to(`project:${attachment.task.projectId}`).emit('attachment:deleted', { taskId: attachment.taskId, attachmentId: id });
        res.json({ message: 'Attachment deleted' });
    }
    catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteAttachment = deleteAttachment;
//# sourceMappingURL=attachment.controller.js.map