"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateUser = exports.rejectUser = exports.approveUser = exports.getPendingCount = exports.getPendingUsers = void 0;
const db_1 = __importDefault(require("../config/db"));
const activity_service_1 = require("../services/activity.service");
// GET /api/admin/pending-users
const getPendingUsers = async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            where: { status: 'PENDING' },
            select: {
                id: true,
                name: true,
                email: true,
                avatarColor: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ users });
    }
    catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPendingUsers = getPendingUsers;
// GET /api/admin/pending-count
const getPendingCount = async (req, res) => {
    try {
        const count = await db_1.default.user.count({ where: { status: 'PENDING' } });
        res.json({ count });
    }
    catch (error) {
        console.error('Get pending count error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPendingCount = getPendingCount;
// PATCH /api/admin/users/:id/approve
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const target = await db_1.default.user.findUnique({ where: { id: id } });
        if (!target) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (target.status !== 'PENDING') {
            res.status(400).json({ message: 'User is not in pending status' });
            return;
        }
        const user = await db_1.default.user.update({
            where: { id: id },
            data: { status: 'ACTIVE', isActive: true },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                isActive: true,
                createdAt: true,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'APPROVED_USER', 'employee', user.id, `Approved user ${user.name}`);
        res.json({ user, message: 'User approved successfully' });
    }
    catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.approveUser = approveUser;
// PATCH /api/admin/users/:id/reject
const rejectUser = async (req, res) => {
    try {
        const { id } = req.params;
        const target = await db_1.default.user.findUnique({ where: { id: id } });
        if (!target) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (target.status !== 'PENDING') {
            res.status(400).json({ message: 'User is not in pending status' });
            return;
        }
        const user = await db_1.default.user.update({
            where: { id: id },
            data: { status: 'REJECTED', isActive: false },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                isActive: true,
                createdAt: true,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'REJECTED_USER', 'employee', user.id, `Rejected user ${user.name}`);
        res.json({ user, message: 'User rejected' });
    }
    catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.rejectUser = rejectUser;
// PATCH /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.id === id) {
            res.status(400).json({ message: 'Cannot deactivate your own account' });
            return;
        }
        const user = await db_1.default.user.update({
            where: { id: id },
            data: { status: 'INACTIVE', isActive: false },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatarColor: true,
                isActive: true,
                createdAt: true,
            },
        });
        await (0, activity_service_1.logActivity)(req.user.id, 'DEACTIVATED_USER', 'employee', user.id, `Deactivated user ${user.name}`);
        res.json({ user, message: 'User deactivated' });
    }
    catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deactivateUser = deactivateUser;
//# sourceMappingURL=admin.controller.js.map