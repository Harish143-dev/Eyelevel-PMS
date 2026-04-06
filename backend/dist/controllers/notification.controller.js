"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            db_1.default.notification.findMany({
                where: { userId: req.user.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db_1.default.notification.count({ where: { userId: req.user.id } }),
            db_1.default.notification.count({ where: { userId: req.user.id, isRead: false } }),
        ]);
        res.json({
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getNotifications = getNotifications;
// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
    try {
        const count = await db_1.default.notification.count({
            where: { userId: req.user.id, isRead: false },
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getUnreadCount = getUnreadCount;
// PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await db_1.default.notification.findUnique({ where: { id: id } });
        if (!notification || notification.userId !== req.user.id) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        await db_1.default.notification.update({
            where: { id: id },
            data: { isRead: true },
        });
        res.json({ message: 'Marked as read' });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.markAsRead = markAsRead;
// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await db_1.default.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.markAllAsRead = markAllAsRead;
// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await db_1.default.notification.findUnique({ where: { id: id } });
        if (!notification || notification.userId !== req.user.id) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        await db_1.default.notification.delete({ where: { id: id } });
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notification.controller.js.map