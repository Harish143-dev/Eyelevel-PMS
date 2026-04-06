"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.forceLogoutSession = exports.getActiveSessions = exports.endSession = exports.createSession = void 0;
const db_1 = __importDefault(require("../config/db"));
// POST /api/session/login — Create a new session on user login
const createSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId, tabId } = req.body;
        if (!deviceId || !tabId) {
            res.status(400).json({ message: 'deviceId and tabId are required' });
            return;
        }
        // Get IP address
        const ipAddress = req.headers['x-forwarded-for'] || req.ip || 'unknown';
        const now = new Date();
        const session = await db_1.default.userSession.create({
            data: {
                userId,
                deviceId,
                tabId,
                loginTime: now,
                lastActiveAt: now,
                isActive: true,
                ipAddress,
            },
        });
        res.status(201).json({ session });
    }
    catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createSession = createSession;
// POST /api/session/logout — End a session
const endSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId, reason } = req.body;
        if (!sessionId) {
            res.status(400).json({ message: 'sessionId is required' });
            return;
        }
        const session = await db_1.default.userSession.findFirst({
            where: { id: sessionId, userId, isActive: true },
        });
        if (!session) {
            res.status(404).json({ message: 'Active session not found' });
            return;
        }
        const updated = await db_1.default.userSession.update({
            where: { id: sessionId },
            data: {
                logoutTime: new Date(),
                isActive: false,
                logoutReason: reason || 'manual',
            },
        });
        res.json({ session: updated });
    }
    catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.endSession = endSession;
// GET /api/session/active — Get current user's active sessions
const getActiveSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await db_1.default.userSession.findMany({
            where: { userId, isActive: true },
            orderBy: { loginTime: 'desc' },
        });
        res.json({ sessions });
    }
    catch (error) {
        console.error('Get active sessions error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getActiveSessions = getActiveSessions;
// POST /api/session/force-logout — Admin force logout a specific session
const forceLogoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ message: 'sessionId is required' });
            return;
        }
        const session = await db_1.default.userSession.findUnique({
            where: { id: sessionId },
        });
        if (!session || !session.isActive) {
            res.status(404).json({ message: 'Active session not found' });
            return;
        }
        const updated = await db_1.default.userSession.update({
            where: { id: sessionId },
            data: {
                logoutTime: new Date(),
                isActive: false,
                logoutReason: 'forced',
            },
        });
        res.json({ session: updated, message: 'Session forcefully ended' });
    }
    catch (error) {
        console.error('Force logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.forceLogoutSession = forceLogoutSession;
// GET /api/session/admin/online — Get all online users (admin only)
const getOnlineUsers = async (req, res) => {
    try {
        const activeSessions = await db_1.default.userSession.findMany({
            where: { isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarColor: true,
                        designation: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { lastActiveAt: 'desc' },
        });
        // Determine status based on lastActiveAt
        const now = Date.now();
        const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        const BREAK_THRESHOLD = 20 * 60 * 1000; // 20 minutes
        const usersWithStatus = activeSessions.map((s) => {
            const elapsed = now - new Date(s.lastActiveAt).getTime();
            let activityStatus = 'active';
            if (elapsed > BREAK_THRESHOLD)
                activityStatus = 'break';
            else if (elapsed > IDLE_THRESHOLD)
                activityStatus = 'idle';
            return {
                sessionId: s.id,
                user: s.user,
                loginTime: s.loginTime,
                lastActiveAt: s.lastActiveAt,
                activityStatus,
                deviceId: s.deviceId,
                ipAddress: s.ipAddress,
            };
        });
        res.json({ onlineUsers: usersWithStatus });
    }
    catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getOnlineUsers = getOnlineUsers;
//# sourceMappingURL=session.controller.js.map