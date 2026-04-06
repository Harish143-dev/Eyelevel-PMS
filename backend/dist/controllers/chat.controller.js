"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.updateMessage = exports.postMessage = exports.getMessages = exports.createChannel = exports.getChannels = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const getChannels = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        let whereClause = {};
        if (projectId) {
            whereClause = { projectId };
        }
        else {
            whereClause = { isDirect: false, projectId: null }; // Example for global channels
        }
        const channels = await db_1.default.chatChannel.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' }
        });
        res.json({ channels });
    }
    catch (error) {
        console.error('Get channels error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getChannels = getChannels;
const createChannel = async (req, res) => {
    try {
        const { name, projectId, isDirect } = req.body;
        const channel = await db_1.default.chatChannel.create({
            data: {
                name,
                projectId: projectId || null,
                isDirect: isDirect || false
            }
        });
        res.status(201).json({ channel });
    }
    catch (error) {
        console.error('Create channel error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createChannel = createChannel;
const getMessages = async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const messages = await db_1.default.chatMessage.findMany({
            where: { channelId },
            include: {
                user: { select: { id: true, name: true, avatarColor: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ messages });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMessages = getMessages;
const postMessage = async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const { content } = req.body;
        const userId = req.user.id;
        const message = await db_1.default.chatMessage.create({
            data: {
                channelId,
                content,
                userId
            },
            include: {
                user: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        // Emit new message via WebSockets to the room for this channel
        (0, socket_1.getIO)().to(`channel:${channelId}`).emit('chat:message', message);
        res.status(201).json({ message });
    }
    catch (error) {
        console.error('Post message error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.postMessage = postMessage;
const updateMessage = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const { content } = req.body;
        const userId = req.user.id;
        const message = await db_1.default.chatMessage.findUnique({
            where: { id: messageId }
        });
        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }
        if (message.userId !== userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const updatedMessage = await db_1.default.chatMessage.update({
            where: { id: messageId },
            data: { content, isEdited: true }, // Cast to any because prisma generate hasn't run yet
            include: {
                user: { select: { id: true, name: true, avatarColor: true } }
            }
        });
        (0, socket_1.getIO)().to(`channel:${message.channelId}`).emit('chat:message_updated', updatedMessage);
        res.json({ message: updatedMessage });
    }
    catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateMessage = updateMessage;
const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.id;
        const userRole = req.user.role;
        const message = await db_1.default.chatMessage.findUnique({
            where: { id: messageId }
        });
        if (!message) {
            res.status(404).json({ message: 'Message not found' });
            return;
        }
        // Allow owner or admin to delete
        if (message.userId !== userId && userRole !== 'admin') {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        await db_1.default.chatMessage.delete({
            where: { id: messageId }
        });
        (0, socket_1.getIO)().to(`channel:${message.channelId}`).emit('chat:message_deleted', {
            id: messageId,
            channelId: message.channelId
        });
        res.json({ message: 'Message deleted' });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=chat.controller.js.map