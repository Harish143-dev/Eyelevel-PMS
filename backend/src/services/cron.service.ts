import cron from 'node-cron';
import prisma from '../config/db';
import { notifyDeadlineReminder } from './notification.service';
import { processRecurringTasks } from './recurringTask.service';

/**
 * Checks for tasks due within the next 24 hours and sends reminders
 */
export const checkDeadlines = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const now = new Date();

    // Find tasks due within 24h that haven't been completed
    const upcomingTasks = await prisma.task.findMany({
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
        await notifyDeadlineReminder(
          task.assignedTo,
          task.title,
          task.id,
          task.projectId
        );
      }
    }
  } catch (error) {
    console.error('[Cron Error] Failed to check deadlines:', error);
  }
};

/**
 * Starts all scheduled cron jobs
 */
export const initCronJobs = () => {
  // Run every day at 9:00 AM — deadline reminders
  cron.schedule('0 9 * * *', () => {
    console.log('[Cron] Running daily deadline check...');
    checkDeadlines();
  });

  // Run every day at 1:00 AM — process recurring tasks
  cron.schedule('0 1 * * *', () => {
    console.log('[Cron] Processing recurring tasks...');
    processRecurringTasks();
  });
};
