"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceLogs = exports.getTodayStatus = exports.checkOut = exports.checkIn = void 0;
const db_1 = __importDefault(require("../config/db"));
// Helper to get today's start and end dates (UTC but treated as local context for simple tracking)
const getTodayRange = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startOfDay, endOfDay };
};
// POST /api/attendance/check-in
const checkIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startOfDay, endOfDay } = getTodayRange();
        // Check if already checked in today
        const existing = await db_1.default.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });
        if (existing) {
            res.status(400).json({ message: 'Already checked in for today.' });
            return;
        }
        // Determine status based on time (e.g., after 10 AM is late)
        // For simplicity, we'll just mark everyone present if they check in manually
        // In a real app, this would be compared against a configured shift start time
        const now = new Date();
        const isLate = now.getHours() >= 10;
        const attendance = await db_1.default.attendance.create({
            data: {
                userId,
                date: startOfDay,
                checkIn: now,
                status: isLate ? 'late' : 'present'
            }
        });
        res.status(201).json({ attendance });
    }
    catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Internal server error while checking in.' });
    }
};
exports.checkIn = checkIn;
// POST /api/attendance/check-out
const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startOfDay, endOfDay } = getTodayRange();
        const attendance = await db_1.default.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });
        if (!attendance) {
            res.status(400).json({ message: 'No check-in record found for today.' });
            return;
        }
        if (attendance.checkOut) {
            res.status(400).json({ message: 'Already checked out for today.' });
            return;
        }
        const now = new Date();
        const durationMs = now.getTime() - attendance.checkIn.getTime();
        const totalHours = durationMs / (1000 * 60 * 60);
        const updated = await db_1.default.attendance.update({
            where: { id: attendance.id },
            data: {
                checkOut: now,
                totalHours: parseFloat(totalHours.toFixed(2))
            }
        });
        res.json({ attendance: updated });
    }
    catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ message: 'Internal server error while checking out.' });
    }
};
exports.checkOut = checkOut;
// GET /api/attendance/status
const getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startOfDay, endOfDay } = getTodayRange();
        const attendance = await db_1.default.attendance.findFirst({
            where: {
                userId,
                date: { gte: startOfDay, lte: endOfDay }
            }
        });
        res.json({ attendance });
    }
    catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ message: 'Internal server error while fetching status.' });
    }
};
exports.getTodayStatus = getTodayStatus;
// GET /api/attendance/logs
const getAttendanceLogs = async (req, res) => {
    try {
        const { startDate, endDate, userId: queryUserId } = req.query;
        const userId = req.user.id;
        const role = req.user.role;
        const where = {};
        // Only allow admins to see others' logs
        if (role === 'manager' || role === 'admin') {
            if (queryUserId) {
                where.userId = queryUserId;
            }
        }
        else {
            where.userId = userId;
        }
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate);
        }
        const logs = await db_1.default.attendance.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, avatarColor: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json({ logs });
    }
    catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ message: 'Internal server error while fetching logs.' });
    }
};
exports.getAttendanceLogs = getAttendanceLogs;
//# sourceMappingURL=attendance.controller.js.map