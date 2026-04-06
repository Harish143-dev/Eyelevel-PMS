"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCleanupJob = exports.cleanupActivityLogs = void 0;
const db_1 = __importDefault(require("../config/db"));
/**
 * Deletes activity logs older than 30 days.
 */
const cleanupActivityLogs = async () => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await db_1.default.activityLog.deleteMany({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });
        if (result.count > 0) {
            console.log(`[Cleanup Service] Deleted ${result.count} old activity logs.`);
        }
    }
    catch (error) {
        console.error('[Cleanup Service] Error during activity log cleanup:', error);
    }
};
exports.cleanupActivityLogs = cleanupActivityLogs;
/**
 * Starts a periodic cleanup task.
 * For simplicity, we'll run it once an hour.
 */
const startCleanupJob = () => {
    // Run immediately on start
    (0, exports.cleanupActivityLogs)();
    // Then every hour
    setInterval(exports.cleanupActivityLogs, 60 * 60 * 1000);
    console.log('[Cleanup Service] Activity log cleanup job started (Hourly)');
};
exports.startCleanupJob = startCleanupJob;
//# sourceMappingURL=cleanup.service.js.map