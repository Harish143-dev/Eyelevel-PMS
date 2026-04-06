/**
 * Deletes activity logs older than 30 days.
 */
export declare const cleanupActivityLogs: () => Promise<void>;
/**
 * Starts a periodic cleanup task.
 * For simplicity, we'll run it once an hour.
 */
export declare const startCleanupJob: () => void;
//# sourceMappingURL=cleanup.service.d.ts.map