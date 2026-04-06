"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAbsentUsers = exports.autoLogoutIdleSessions = exports.computeDailySummaries = void 0;
const db_1 = __importDefault(require("../config/db"));
/**
 * Compute and store daily WorkSummary for all users.
 * Should be run via cron at end of day (e.g., 11:55 PM).
 */
const computeDailySummaries = async () => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        console.log(`[WorkSummary] Computing summaries for ${startOfDay.toISOString().split('T')[0]}...`);
        // Get all active users
        const users = await db_1.default.user.findMany({
            where: { isActive: true, status: 'ACTIVE' },
            select: { id: true },
        });
        let computed = 0;
        for (const user of users) {
            try {
                // Get heartbeats for today
                const heartbeats = await db_1.default.activityHeartbeat.findMany({
                    where: {
                        userId: user.id,
                        timestamp: { gte: startOfDay, lte: endOfDay },
                    },
                    orderBy: { timestamp: 'asc' },
                });
                // Compute time breakdowns
                let activeTime = 0;
                let idleTime = 0;
                let breakTime = 0;
                for (let i = 0; i < heartbeats.length - 1; i++) {
                    const gap = (new Date(heartbeats[i + 1].timestamp).getTime() -
                        new Date(heartbeats[i].timestamp).getTime()) / 1000;
                    const effectiveGap = Math.min(gap, 300); // cap at 5 minutes
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
                // Get attendance record
                const attendance = await db_1.default.attendance.findFirst({
                    where: {
                        userId: user.id,
                        date: { gte: startOfDay, lte: endOfDay },
                    },
                });
                // Detect anomalies
                const { hasAnomaly, anomalyReason } = detectAnomalies(heartbeats, activeTime, totalSessionTime);
                // Determine attendance status
                let attendanceStatus = 'absent';
                let lateMinutes = 0;
                if (attendance) {
                    attendanceStatus = attendance.status;
                    if (attendance.checkIn) {
                        const workStartHour = parseInt(process.env.WORK_START_HOUR || '9', 10);
                        const checkInHour = new Date(attendance.checkIn).getHours();
                        const checkInMinute = new Date(attendance.checkIn).getMinutes();
                        const minutesPastStart = (checkInHour - workStartHour) * 60 + checkInMinute;
                        if (minutesPastStart > 15) {
                            lateMinutes = minutesPastStart;
                        }
                    }
                    // Adjust for half-day
                    if (totalSessionTime > 0 && totalSessionTime < 4 * 3600) {
                        attendanceStatus = 'half-day';
                    }
                }
                // Upsert work summary
                await db_1.default.workSummary.upsert({
                    where: {
                        userId_date: {
                            userId: user.id,
                            date: startOfDay,
                        },
                    },
                    update: {
                        checkInTime: attendance?.checkIn || null,
                        checkOutTime: attendance?.checkOut || null,
                        totalSessionTime: Math.round(totalSessionTime),
                        totalActiveTime: Math.round(activeTime),
                        totalIdleTime: Math.round(idleTime),
                        totalBreakTime: Math.round(breakTime),
                        productiveTime: Math.round(activeTime),
                        attendanceStatus,
                        lateMinutes,
                        hasAnomaly,
                        anomalyReason,
                    },
                    create: {
                        userId: user.id,
                        date: startOfDay,
                        checkInTime: attendance?.checkIn || null,
                        checkOutTime: attendance?.checkOut || null,
                        totalSessionTime: Math.round(totalSessionTime),
                        totalActiveTime: Math.round(activeTime),
                        totalIdleTime: Math.round(idleTime),
                        totalBreakTime: Math.round(breakTime),
                        productiveTime: Math.round(activeTime),
                        attendanceStatus,
                        lateMinutes,
                        hasAnomaly,
                        anomalyReason,
                    },
                });
                // Also update the attendance record with time breakdowns
                if (attendance) {
                    await db_1.default.attendance.update({
                        where: { id: attendance.id },
                        data: {
                            totalActiveTime: Math.round(activeTime),
                            totalIdleTime: Math.round(idleTime),
                            totalBreakTime: Math.round(breakTime),
                            productiveTime: Math.round(activeTime),
                            lateMinutes,
                        },
                    });
                }
                computed++;
            }
            catch (err) {
                console.error(`[WorkSummary] Error computing summary for user ${user.id}:`, err);
            }
        }
        console.log(`[WorkSummary] Computed ${computed}/${users.length} summaries.`);
    }
    catch (error) {
        console.error('[WorkSummary] Fatal error:', error);
    }
};
exports.computeDailySummaries = computeDailySummaries;
/**
 * Auto-logout sessions that have been idle for more than 30 minutes.
 */
const autoLogoutIdleSessions = async () => {
    try {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
        const result = await db_1.default.userSession.updateMany({
            where: {
                isActive: true,
                lastActiveAt: { lt: cutoff },
            },
            data: {
                isActive: false,
                logoutTime: new Date(),
                logoutReason: 'timeout',
            },
        });
        if (result.count > 0) {
            console.log(`[AutoLogout] Closed ${result.count} idle sessions.`);
        }
    }
    catch (error) {
        console.error('[AutoLogout] Error:', error);
    }
};
exports.autoLogoutIdleSessions = autoLogoutIdleSessions;
/**
 * Mark users with no check-in as absent at end of day.
 */
const markAbsentUsers = async () => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const allUsers = await db_1.default.user.findMany({
            where: { isActive: true, status: 'ACTIVE' },
            select: { id: true },
        });
        const checkedInUsers = await db_1.default.attendance.findMany({
            where: {
                date: startOfDay,
            },
            select: { userId: true },
        });
        const checkedInSet = new Set(checkedInUsers.map((a) => a.userId));
        let markedAbsent = 0;
        for (const user of allUsers) {
            if (!checkedInSet.has(user.id)) {
                await db_1.default.workSummary.upsert({
                    where: {
                        userId_date: {
                            userId: user.id,
                            date: startOfDay,
                        },
                    },
                    update: { attendanceStatus: 'absent' },
                    create: {
                        userId: user.id,
                        date: startOfDay,
                        attendanceStatus: 'absent',
                    },
                });
                markedAbsent++;
            }
        }
        console.log(`[MarkAbsent] Marked ${markedAbsent} users as absent.`);
    }
    catch (error) {
        console.error('[MarkAbsent] Error:', error);
    }
};
exports.markAbsentUsers = markAbsentUsers;
// Detect anomalies in heartbeat data
function detectAnomalies(heartbeats, activeTime, totalSessionTime) {
    const reasons = [];
    // 1. Active 8+ hours with zero idle
    if (activeTime > 8 * 3600 && totalSessionTime === activeTime) {
        reasons.push('Active 8+ hours with zero idle time');
    }
    // 2. Rapid heartbeats (faster than 30 second intervals)
    let rapidCount = 0;
    for (let i = 1; i < heartbeats.length; i++) {
        const gap = new Date(heartbeats[i].timestamp).getTime() - new Date(heartbeats[i - 1].timestamp).getTime();
        if (gap < 30000)
            rapidCount++;
    }
    if (rapidCount > 10) {
        reasons.push(`${rapidCount} rapid heartbeats detected (< 30s intervals)`);
    }
    return {
        hasAnomaly: reasons.length > 0,
        anomalyReason: reasons.length > 0 ? reasons.join('; ') : null,
    };
}
//# sourceMappingURL=workSummary.service.js.map