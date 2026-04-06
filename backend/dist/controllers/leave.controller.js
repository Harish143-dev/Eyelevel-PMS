"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveStatus = exports.getAllLeaves = exports.applyLeave = exports.getMyLeaves = void 0;
const db_1 = __importDefault(require("../config/db"));
const notification_service_1 = require("../services/notification.service");
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await db_1.default.leaveRequest.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ leaves });
    }
    catch (error) {
        console.error('Get my leaves error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyLeaves = getMyLeaves;
const applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, type, reason } = req.body;
        // Basic validation
        if (!startDate || !endDate || !type || !reason) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            res.status(400).json({ message: 'End date cannot be earlier than start date' });
            return;
        }
        const leave = await db_1.default.leaveRequest.create({
            data: {
                userId: req.user.id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                type,
                reason,
                status: 'PENDING',
            },
        });
        res.status(201).json({ leave });
    }
    catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.applyLeave = applyLeave;
const getAllLeaves = async (req, res) => {
    try {
        const leaves = await db_1.default.leaveRequest.findMany({
            include: {
                user: { select: { id: true, name: true, avatarColor: true, designation: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ leaves });
    }
    catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllLeaves = getAllLeaves;
const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }
        const leave = await db_1.default.leaveRequest.update({
            where: { id },
            data: { status, adminNote },
        });
        // Send notification to the employee
        try {
            await (0, notification_service_1.notifyLeaveStatus)(leave.userId, status, leave.startDate.toISOString(), leave.endDate.toISOString(), req.user.name, adminNote);
        }
        catch (e) {
            console.error('Failed to send leave notification:', e);
        }
        res.json({ leave });
    }
    catch (error) {
        console.error('Update leave status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateLeaveStatus = updateLeaveStatus;
//# sourceMappingURL=leave.controller.js.map