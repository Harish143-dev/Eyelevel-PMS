"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = exports.checkDeadlines = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../config/db"));
const notification_service_1 = require("./notification.service");
const recurringTask_service_1 = require("./recurringTask.service");
/**
 * Checks for tasks due within the next 24 hours and sends reminders
 */
const checkDeadlines = async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const now = new Date();
        // Find tasks due within 24h that haven't been completed
        const upcomingTasks = await db_1.default.task.findMany({
            where: {
                dueDate: {
                    gte: now,
                    lte: tomorrow,
                },
                status: {
                    not: 'completed',
                },
                assignedTo: {
                    not: null,
                },
            },
            select: {
                id: true,
                title: true,
                assignedTo: true,
                projectId: true,
            }
        });
        console.log(`[Cron] Found ${upcomingTasks.length} tasks with upcoming deadlines.`);
        for (const task of upcomingTasks) {
            if (task.assignedTo) {
                await (0, notification_service_1.notifyDeadlineReminder)(task.assignedTo, task.title, task.id, task.projectId);
            }
        }
    }
    catch (error) {
        console.error('[Cron Error] Failed to check deadlines:', error);
    }
};
exports.checkDeadlines = checkDeadlines;
/**
 * Starts all scheduled cron jobs
 */
const initCronJobs = () => {
    // Run every day at 9:00 AM — deadline reminders
    node_cron_1.default.schedule('0 9 * * *', () => {
        console.log('[Cron] Running daily deadline check...');
        (0, exports.checkDeadlines)();
    });
    // Run every day at 1:00 AM — process recurring tasks
    node_cron_1.default.schedule('0 1 * * *', () => {
        console.log('[Cron] Processing recurring tasks...');
        (0, recurringTask_service_1.processRecurringTasks)();
    });
};
exports.initCronJobs = initCronJobs;
//# sourceMappingURL=cron.service.js.map