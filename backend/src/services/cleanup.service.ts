import prisma from '../config/db';

/**
 * Deletes activity logs older than 30 days.
 */
export const cleanupActivityLogs = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    if (result.count > 0) {
      console.log(`[Cleanup Service] Deleted ${result.count} old activity logs.`);
    }
  } catch (error) {
    console.error('[Cleanup Service] Error during activity log cleanup:', error);
  }
};

/**
 * Starts a periodic cleanup task.
 * For simplicity, we'll run it once an hour.
 */
export const startCleanupJob = () => {
    // Run immediately on start
    cleanupActivityLogs();
    
    // Then every hour
    setInterval(cleanupActivityLogs, 60 * 60 * 1000);
    console.log('[Cleanup Service] Activity log cleanup job started (Hourly)');
};
