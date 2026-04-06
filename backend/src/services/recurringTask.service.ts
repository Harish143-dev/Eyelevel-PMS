import prisma from '../config/db';

/**
 * Recurring Tasks Service
 * 
 * Supports recurringRule values:
 *   - "daily"
 *   - "weekly"
 *   - "monthly"
 * 
 * Runs via cron every day at 1:00 AM.
 * Finds recurring tasks that are due for renewal, creates fresh copies,
 * and updates the parent task's lastRecurringDate.
 */

const isRecurringDue = (rule: string, lastDate: Date | null): boolean => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastDate) return true; // Never generated before

  const last = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const diffMs = today.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (rule) {
    case 'daily':
      return diffDays >= 1;
    case 'weekly':
      return diffDays >= 7;
    case 'monthly':
      return (
        today.getMonth() !== last.getMonth() ||
        today.getFullYear() !== last.getFullYear()
      );
    default:
      return false;
  }
};

const computeNextDueDate = (rule: string, baseDueDate: Date | null): Date | null => {
  if (!baseDueDate) return null;

  const next = new Date(baseDueDate);
  switch (rule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
};

export const processRecurringTasks = async (): Promise<void> => {
  try {
    // Use raw-style query via Prisma to find tasks with recurring rules
    const recurringTasks: any[] = await (prisma.task as any).findMany({
      where: {
        recurringRule: { not: null },
        parentTaskId: null,
      },
      include: {
        project: { select: { isArchived: true } },
      },
    });

    let created = 0;

    for (const task of recurringTasks) {
      // Skip if project is archived
      if (task.project?.isArchived) continue;

      // Skip if the recurring rule is empty
      if (!task.recurringRule) continue;

      // Check if it's time to create a new instance
      if (!isRecurringDue(task.recurringRule, task.lastRecurringDate)) continue;

      // Only create a new recurring instance if the current task is completed/cancelled
      // OR if the task has never generated a recurring child
      if (
        task.status !== 'completed' &&
        task.status !== 'cancelled' &&
        task.lastRecurringDate !== null
      ) {
        continue;
      }

      // Get next due date
      const nextDueDate = computeNextDueDate(task.recurringRule, task.dueDate);

      // Get the max position in this project
      const maxPosition = await prisma.task.findFirst({
        where: { projectId: task.projectId, status: 'pending', parentTaskId: null },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      // Create a new task instance
      await (prisma.task as any).create({
        data: {
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          createdBy: task.createdBy,
          assignedTo: task.assignedTo,
          dueDate: nextDueDate,
          priority: task.priority,
          status: 'pending',
          position: (maxPosition?.position ?? -1) + 1,
          customFields: task.customFields || undefined,
          recurringRule: task.recurringRule,
        },
      });

      // Update the original task's lastRecurringDate
      await (prisma.task as any).update({
        where: { id: task.id },
        data: { lastRecurringDate: new Date() },
      });

      created++;
    }

    if (created > 0) {
      console.log(`[Recurring Tasks] Created ${created} recurring task instance(s).`);
    }
  } catch (error) {
    console.error('[Recurring Tasks Error]', error);
  }
};
