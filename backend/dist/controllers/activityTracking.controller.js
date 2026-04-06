"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSummariesCSV = exports.getAnomalies = exports.getAdminLiveStatus = exports.getTeamSummary = exports.getMyActivityStatus = exports.getDailySummary = exports.recordBatchHeartbeats = exports.recordHeartbeat = void 0;
const db_1 = __importDefault(require("../config/db"));
// POST /api/activity — Record a single heartbeat
const recordHeartbeat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId, status, source, timestamp } = req.body;
        if (!sessionId || !status) {
            res.status(400).json({ message: 'sessionId and status are required' });
            return;
        }
        // Validate status
        const validStatuses = ['active', 'idle', 'break', 'offline'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        // Verify session belongs to user and is active
        const session = await db_1.default.userSession.findFirst({
            where: { id: sessionId, userId, isActive: true },
        });
        if (!session) {
            res.status(404).json({ message: 'Active session not found' });
            return;
        }
        const now = new Date();
        const heartbeatTime = timestamp ? new Date(timestamp) : now;
        // Create heartbeat entry
        const heartbeat = await db_1.default.activityHeartbeat.create({
            data: {
                userId,
                sessionId,
                timestamp: heartbeatTime,
                status,
                source: source || 'heartbeat',
            },
        });
        // Update session's lastActiveAt
        await db_1.default.userSession.update({
            where: { id: sessionId },
            data: { lastActiveAt: now },
        });
        res.status(201).json({ heartbeat });
    }
    catch (error) {
        console.error('Record heartbeat error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.recordHeartbeat = recordHeartbeat;
// POST /api/activity/batch — Record multiple heartbeats (offline queue flush)
const recordBatchHeartbeats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { heartbeats } = req.body;
        if (!Array.isArray(heartbeats) || heartbeats.length === 0) {
            res.status(400).json({ message: 'heartbeats array is required' });
            return;
        }
        // Limit batch size
        if (heartbeats.length > 500) {
            res.status(400).json({ message: 'Maximum 500 heartbeats per batch' });
            return;
        }
        const data = heartbeats.map((hb) => ({
            userId,
            sessionId: hb.sessionId,
            timestamp: new Date(hb.timestamp),
            status: hb.status || 'active',
            source: hb.source || 'heartbeat',
        }));
        const result = await db_1.default.activityHeartbeat.createMany({
            data,
            skipDuplicates: true,
        });
        // Update session lastActiveAt to the most recent heartbeat
        const latestTimestamp = heartbeats.reduce((latest, hb) => {
            return hb.timestamp > latest ? hb.timestamp : latest;
        }, heartbeats[0].timestamp);
        if (heartbeats[0]?.sessionId) {
            await db_1.default.userSession.updateMany({
                where: { id: heartbeats[0].sessionId, userId },
                data: { lastActiveAt: new Date(latestTimestamp) },
            });
        }
        res.status(201).json({ count: result.count, message: `${result.count} heartbeats recorded` });
    }
    catch (error) {
        console.error('Batch heartbeat error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.recordBatchHeartbeats = recordBatchHeartbeats;
// GET /api/activity/summary/:userId — Get daily work summary
const getDailySummary = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const { date } = req.query;
        // Authorization: self or admin
        if (targetUserId !== req.user.id && !['manager', 'admin'].includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized' });
            return;
        }
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        // Check if pre-computed summary exists
        const existingSummary = await db_1.default.workSummary.findFirst({
            where: {
                userId: targetUserId,
                date: { gte: startOfDay, lte: endOfDay },
            },
        });
        if (existingSummary) {
            res.json({ summary: existingSummary });
            return;
        }
        // Compute on-the-fly from heartbeats
        const heartbeats = await db_1.default.activityHeartbeat.findMany({
            where: {
                userId: targetUserId,
                timestamp: { gte: startOfDay, lte: endOfDay },
            },
            orderBy: { timestamp: 'asc' },
        });
        const summary = computeSummaryFromHeartbeats(heartbeats);
        // Get attendance info
        const attendance = await db_1.default.attendance.findFirst({
            where: {
                userId: targetUserId,
                date: { gte: startOfDay, lte: endOfDay },
            },
        });
        res.json({
            summary: {
                userId: targetUserId,
                date: startOfDay.toISOString().split('T')[0],
                checkInTime: attendance?.checkIn || null,
                checkOutTime: attendance?.checkOut || null,
                ...summary,
                attendanceStatus: attendance?.status || 'absent',
            },
        });
    }
    catch (error) {
        console.error('Get daily summary error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getDailySummary = getDailySummary;
// GET /api/activity/my-status — Get current user's real-time activity status
const getMyActivityStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        // Get active session
        const activeSession = await db_1.default.userSession.findFirst({
            where: { userId, isActive: true },
            orderBy: { loginTime: 'desc' },
        });
        if (!activeSession) {
            res.json({ isOnline: false, status: 'offline', session: null });
            return;
        }
        // Get today's heartbeats for computing live summary
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const heartbeats = await db_1.default.activityHeartbeat.findMany({
            where: {
                userId,
                timestamp: { gte: startOfDay, lte: now },
            },
            orderBy: { timestamp: 'asc' },
        });
        const summary = computeSummaryFromHeartbeats(heartbeats);
        // Determine current status from lastActiveAt
        const elapsed = now.getTime() - new Date(activeSession.lastActiveAt).getTime();
        let currentStatus = 'active';
        if (elapsed > 20 * 60 * 1000)
            currentStatus = 'break';
        else if (elapsed > 5 * 60 * 1000)
            currentStatus = 'idle';
        res.json({
            isOnline: true,
            currentStatus,
            session: {
                id: activeSession.id,
                loginTime: activeSession.loginTime,
                lastActiveAt: activeSession.lastActiveAt,
            },
            todaySummary: summary,
        });
    }
    catch (error) {
        console.error('Get activity status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getMyActivityStatus = getMyActivityStatus;
// GET /api/activity/admin/team-summary — Get team summary for admin
const getTeamSummary = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        // Get all work summaries for the day
        const summaries = await db_1.default.workSummary.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarColor: true,
                        designation: true,
                        department: { select: { name: true } },
                    },
                },
            },
            orderBy: { productiveTime: 'desc' },
        });
        // Get attendance stats
        const attendanceStats = await db_1.default.attendance.groupBy({
            by: ['status'],
            where: {
                date: { gte: startOfDay, lte: endOfDay },
            },
            _count: true,
        });
        const totalUsers = await db_1.default.user.count({
            where: { isActive: true, status: 'ACTIVE' },
        });
        res.json({
            summaries,
            attendanceStats: attendanceStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count;
                return acc;
            }, {}),
            totalUsers,
        });
    }
    catch (error) {
        console.error('Get team summary error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getTeamSummary = getTeamSummary;
// GET /api/activity/admin/live — Get live status of all active sessions
const getAdminLiveStatus = async (req, res) => {
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
                    },
                },
            },
            orderBy: { lastActiveAt: 'desc' },
        });
        const now = new Date().getTime();
        const liveStatuses = activeSessions.map(session => {
            const elapsed = now - new Date(session.lastActiveAt).getTime();
            let currentStatus = 'active';
            // If inactive for > 30 mins, might just be hanging (cron hasn't swept it yet) - mark offline
            if (elapsed > 30 * 60 * 1000)
                currentStatus = 'offline';
            else if (elapsed > 20 * 60 * 1000)
                currentStatus = 'break';
            else if (elapsed > 5 * 60 * 1000)
                currentStatus = 'idle';
            return {
                sessionId: session.id,
                userId: session.userId,
                user: session.user,
                deviceId: session.deviceId,
                ipAddress: session.ipAddress,
                loginTime: session.loginTime,
                lastActiveAt: session.lastActiveAt,
                currentStatus,
            };
        });
        res.json({ liveStatuses });
    }
    catch (error) {
        console.error('Get admin live status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAdminLiveStatus = getAdminLiveStatus;
// GET /api/activity/admin/anomalies — Get list of suspicious work summaries
const getAnomalies = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - Number(days));
        const anomalies = await db_1.default.workSummary.findMany({
            where: {
                hasAnomaly: true,
                date: { gte: sinceDate },
            },
            include: {
                user: { select: { id: true, name: true, avatarColor: true, designation: true } },
            },
            orderBy: { date: 'desc' },
            take: 100,
        });
        res.json({ anomalies });
    }
    catch (error) {
        console.error('Get anomalies error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAnomalies = getAnomalies;
// Helper: compute summary from heartbeat logs
function computeSummaryFromHeartbeats(heartbeats) {
    let activeTime = 0;
    let idleTime = 0;
    let breakTime = 0;
    let tooFastCount = 0;
    for (let i = 0; i < heartbeats.length - 1; i++) {
        const gap = (new Date(heartbeats[i + 1].timestamp).getTime() - new Date(heartbeats[i].timestamp).getTime()) / 1000;
        if (gap > 0 && gap < 30) {
            tooFastCount++;
        }
        // Cap gap at 5 minutes (300s) to avoid counting long disconnections
        const effectiveGap = Math.min(gap, 300);
        switch (heartbeats[i].status) {
            case 'active':
                activeTime += effectiveGap;
                break;
            case 'idle':
                idleTime += effectiveGap;
                break;
            case 'break':
                breakTime += effectiveGap;
                break;
        }
    }
    const totalSessionTime = activeTime + idleTime + breakTime;
    let hasAnomaly = false;
    let anomalyReason = null;
    if (activeTime > 8 * 60 * 60 && idleTime === 0) {
        hasAnomaly = true;
        anomalyReason = '8+ hours continuous active time with zero idle time';
    }
    else if (tooFastCount > 50) {
        hasAnomaly = true;
        anomalyReason = 'Suspiciously rapid heartbeats detected';
    }
    return {
        totalSessionTime: Math.round(totalSessionTime),
        totalActiveTime: Math.round(activeTime),
        totalIdleTime: Math.round(idleTime),
        totalBreakTime: Math.round(breakTime),
        productiveTime: Math.round(activeTime), // productive = active
        hasAnomaly,
        anomalyReason,
    };
}
// GET /api/activity/admin/export — Export work summaries as CSV
const exportSummariesCSV = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        const summaries = await db_1.default.workSummary.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                user: { select: { name: true, email: true, designation: true } },
            },
            orderBy: { user: { name: 'asc' } },
        });
        const csvRows = [
            ['Name', 'Email', 'Designation', 'Date', 'Check In', 'Check Out', 'Attendance Status', 'Total Session Time (m)', 'Active Time (m)', 'Idle Time (m)', 'Break Time (m)', 'Has Anomaly']
        ];
        summaries.forEach(s => {
            csvRows.push([
                s.user?.name || 'Unknown',
                s.user?.email || 'Unknown',
                s.user?.designation || '',
                startOfDay.toISOString().split('T')[0],
                s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString() : 'N/A',
                s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : 'N/A',
                s.attendanceStatus || 'absent',
                (s.totalSessionTime / 60).toFixed(0),
                (s.totalActiveTime / 60).toFixed(0),
                (s.totalIdleTime / 60).toFixed(0),
                (s.totalBreakTime / 60).toFixed(0),
                s.hasAnomaly ? 'Yes' : 'No',
            ]);
        });
        const csvString = csvRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="work-summary-${startOfDay.toISOString().split('T')[0]}.csv"`);
        res.send(csvString);
    }
    catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.exportSummariesCSV = exportSummariesCSV;
//# sourceMappingURL=activityTracking.controller.js.map