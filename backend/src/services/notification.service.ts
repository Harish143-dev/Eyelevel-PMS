import prisma from '../config/db';
import { getIO } from '../config/socket';
import { sendNotificationEmail } from './email.service';

type NotificationType = 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'MENTIONED' | 'DEADLINE_REMINDER' | 'PROJECT_ADDED' | 'PROJECT_UPDATED' | 'TASK_OVERDUE' | 'MILESTONE_COMPLETED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  message: string,
  link?: string
) => {
  try {
    const notification: any = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        message,
        link,
      },
      include: {
        user: { 
          select: { 
            email: true, 
            name: true, 
            companyId: true 
          } 
        }
      }
    });

    const companyId = notification.user.companyId;
    let matrixRules = { email: true, inApp: true, telegram: false };
    let telegramChatId: string | null = null;
    let telegramBotToken: string | null = null;

    if (companyId) {
      const companySettings = await prisma.companySettings.findUnique({
        where: { companyId }
      });
      if (companySettings) {
        if (companySettings.notificationMatrix) {
          const matrix = companySettings.notificationMatrix as Record<string, { email: boolean; inApp: boolean; telegram: boolean }>;
          if (matrix[type]) {
            matrixRules = matrix[type];
          }
        }
        telegramChatId = companySettings.telegramChatId;
        telegramBotToken = companySettings.telegramBotToken;
      }
    }

    // 1. In-App Notification (Socket)
    if (matrixRules.inApp) {
      try {
        getIO().to(`user:${userId}`).emit('notification:new', notification);
      } catch (e) {
        console.warn('Could not emit socket notification:', e);
      }
    }

    const subjectMap: Record<string, string> = {
      TASK_ASSIGNED: 'New Task Assigned',
      STATUS_CHANGED: 'Task Status Updated',
      COMMENT_ADDED: 'New Comment on Task',
      MENTIONED: 'You were mentioned',
      DEADLINE_REMINDER: 'Upcoming Task Deadline',
      PROJECT_ADDED: 'Added to New Project',
      PROJECT_UPDATED: 'Project Updated',
      TASK_OVERDUE: 'Task Overdue',
      MILESTONE_COMPLETED: 'Milestone Completed',
      LEAVE_APPROVED: 'Leave Request Approved',
      LEAVE_REJECTED: 'Leave Request Rejected',
    };

    // 2. Email Notification
    if (matrixRules.email && notification.user.email) {
      sendNotificationEmail(
        notification.user.email,
        subjectMap[type] || 'New Notification',
        message,
        'View Details',
        link || '/'
      ).catch(e => console.error('Background email failed:', e));
    }

    // 3. Telegram Notification
    if (matrixRules.telegram && telegramBotToken && telegramChatId) {
      try {
        const text = `*${subjectMap[type] || 'New Notification'}*\n${message}\n\n[View Details](${process.env.FRONTEND_URL || 'http://localhost:5173'}${link || '/'})`;
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
            parse_mode: 'Markdown'
          })
        }).catch(err => console.error('Telegram notification error:', err));
      } catch (e) {
        console.error('Failed to prepare Telegram msg:', e);
      }
    }
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Notify when a task is assigned
export const notifyTaskAssigned = async (
  assigneeId: string,
  taskTitle: string,
  taskId: string,
  projectId: string,
  assignedByName: string
) => {
  return createNotification(
    assigneeId,
    'TASK_ASSIGNED',
    `${assignedByName} assigned you to task "${taskTitle}"`,
    `/pm/projects/${projectId}?task=${taskId}`
  );
};

// Notify when a user is mentioned
export const notifyUserMentioned = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  projectId: string,
  mentionerName: string
) => {
  return createNotification(
    userId,
    'MENTIONED',
    `${mentionerName} mentioned you in task "${taskTitle}"`,
    `/pm/projects/${projectId}?task=${taskId}`
  );
};

// Notify when task status changes
export const notifyStatusChanged = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  projectId: string,
  newStatus: string,
  changedByName: string
) => {
  return createNotification(
    userId,
    'STATUS_CHANGED',
    `${changedByName} changed task "${taskTitle}" status to ${newStatus}`,
    `/pm/projects/${projectId}?task=${taskId}`
  );
};

// Notify when a comment is added
export const notifyCommentAdded = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  projectId: string,
  commenterName: string
) => {
  return createNotification(
    userId,
    'COMMENT_ADDED',
    `${commenterName} commented on task "${taskTitle}"`,
    `/pm/projects/${projectId}?task=${taskId}`
  );
};

// Notify when a user is added to a project
export const notifyProjectAdded = async (
  userId: string,
  projectName: string,
  projectId: string,
  addedByName: string
) => {
  return createNotification(
    userId,
    'PROJECT_ADDED',
    `${addedByName} added you to project "${projectName}"`,
    `/pm/projects/${projectId}`
  );
};

// Notify deadline reminder (for cron job)
export const notifyDeadlineReminder = async (
  userId: string,
  taskTitle: string,
  taskId: string,
  projectId: string
) => {
  return createNotification(
    userId,
    'DEADLINE_REMINDER',
    `Task "${taskTitle}" is due within 24 hours!`,
    `/pm/projects/${projectId}?task=${taskId}`
  );
};

// Notify when a project is updated
export const notifyProjectUpdated = async (
  userId: string,
  projectName: string,
  projectId: string,
  updateDescription: string,
  updatedByName: string
) => {
  return createNotification(
    userId,
    'PROJECT_UPDATED',
    `${updatedByName} updated project "${projectName}": ${updateDescription}`,
    `/pm/projects/${projectId}`
  );
};

// Notify when a leave request is approved or rejected
export const notifyLeaveStatus = async (
  userId: string,
  status: 'APPROVED' | 'REJECTED',
  startDate: string,
  endDate: string,
  reviewerName: string,
  adminNote?: string
) => {
  const type: NotificationType = status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED';
  const statusLabel = status.toLowerCase();
  const noteText = adminNote ? ` Note: "${adminNote}"` : '';
  return createNotification(
    userId,
    type,
    `Your leave request (${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}) has been ${statusLabel} by ${reviewerName}.${noteText}`,
    '/hr/leaves'
  );
};

// Notify all project members when a milestone is completed
export const notifyMilestoneCompleted = async (
  projectId: string,
  milestoneTitle: string,
  completedByName: string
) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });

  for (const member of members) {
    await createNotification(
      member.userId,
      'MILESTONE_COMPLETED',
      `Milestone "${milestoneTitle}" has been completed by ${completedByName}`,
      `/pm/projects/${projectId}`
    );
  }
};
