/**
 * Compute and store daily WorkSummary for all users.
 * Should be run via cron at end of day (e.g., 11:55 PM).
 */
export declare const computeDailySummaries: () => Promise<void>;
/**
 * Auto-logout sessions that have been idle for more than 30 minutes.
 */
export declare const autoLogoutIdleSessions: () => Promise<void>;
/**
 * Mark users with no check-in as absent at end of day.
 */
export declare const markAbsentUsers: () => Promise<void>;
//# sourceMappingURL=workSummary.service.d.ts.map