"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyMilestoneCompleted = exports.notifyLeaveStatus = exports.notifyProjectUpdated = exports.notifyDeadlineReminder = exports.notifyProjectAdded = exports.notifyCommentAdded = exports.notifyStatusChanged = exports.notifyUserMentioned = exports.notifyTaskAssigned = exports.createNotification = void 0;
const db_1 = __importDefault(require("../config/db"));
const socket_1 = require("../config/socket");
const email_service_1 = require("./email.service");
const createNotification = async (userId, type, message, link) => {
    try {
        const notification = await db_1.default.notification.create({
            data: {
                userId,
                type: type,
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
        let telegramChatId = null;
        let telegramBotToken = null;
        if (companyId) {
            const companySettings = await db_1.default.companySettings.findUnique({
                where: { companyId }
            });
            if (companySettings) {
                if (companySettings.notificationMatrix) {
                    const matrix = companySettings.notificationMatrix;
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
                (0, socket_1.getIO)().to(`user:${userId}`).emit('notification:new', notification);
            }
            catch (e) {
                console.warn('Could not emit socket notification:', e);
            }
        }
        const subjectMap = {
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
            (0, email_service_1.sendNotificationEmail)(notification.user.email, subjectMap[type] || 'New Notification', message, 'View Details', link || '/').catch(e => console.error('Background email failed:', e));
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
            }
            catch (e) {
                console.error('Failed to prepare Telegram msg:', e);
            }
        }
        return notification;
    }
    catch (error) {
        console.error('Failed to create notification:', error);
    }
};
exports.createNotification = createNotification;
// Notify when a task is assigned
const notifyTaskAssigned = async (assigneeId, taskTitle, taskId, projectId, assignedByName) => {
    return (0, exports.createNotification)(assigneeId, 'TASK_ASSIGNED', `${assignedByName} assigned you to task "${taskTitle}"`, `/pm/projects/${projectId}?task=${taskId}`);
};
exports.notifyTaskAssigned = notifyTaskAssigned;
// Notify when a user is mentioned
const notifyUserMentioned = async (userId, taskTitle, taskId, projectId, mentionerName) => {
    return (0, exports.createNotification)(userId, 'MENTIONED', `${mentionerName} mentioned you in task "${taskTitle}"`, `/pm/projects/${projectId}?task=${taskId}`);
};
exports.notifyUserMentioned = notifyUserMentioned;
// Notify when task status changes
const notifyStatusChanged = async (userId, taskTitle, taskId, projectId, newStatus, changedByName) => {
    return (0, exports.createNotification)(userId, 'STATUS_CHANGED', `${changedByName} changed task "${taskTitle}" status to ${newStatus}`, `/pm/projects/${projectId}?task=${taskId}`);
};
exports.notifyStatusChanged = notifyStatusChanged;
// Notify when a comment is added
const notifyCommentAdded = async (userId, taskTitle, taskId, projectId, commenterName) => {
    return (0, exports.createNotification)(userId, 'COMMENT_ADDED', `${commenterName} commented on task "${taskTitle}"`, `/pm/projects/${projectId}?task=${taskId}`);
};
exports.notifyCommentAdded = notifyCommentAdded;
// Notify when a user is added to a project
const notifyProjectAdded = async (userId, projectName, projectId, addedByName) => {
    return (0, exports.createNotification)(userId, 'PROJECT_ADDED', `${addedByName} added you to project "${projectName}"`, `/pm/projects/${projectId}`);
};
exports.notifyProjectAdded = notifyProjectAdded;
// Notify deadline reminder (for cron job)
const notifyDeadlineReminder = async (userId, taskTitle, taskId, projectId) => {
    return (0, exports.createNotification)(userId, 'DEADLINE_REMINDER', `Task "${taskTitle}" is due within 24 hours!`, `/pm/projects/${projectId}?task=${taskId}`);
};
exports.notifyDeadlineReminder = notifyDeadlineReminder;
// Notify when a project is updated
const notifyProjectUpdated = async (userId, projectName, projectId, updateDescription, updatedByName) => {
    return (0, exports.createNotification)(userId, 'PROJECT_UPDATED', `${updatedByName} updated project "${projectName}": ${updateDescription}`, `/pm/projects/${projectId}`);
};
exports.notifyProjectUpdated = notifyProjectUpdated;
// Notify when a leave request is approved or rejected
const notifyLeaveStatus = async (userId, status, startDate, endDate, reviewerName, adminNote) => {
    const type = status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED';
    const statusLabel = status.toLowerCase();
    const noteText = adminNote ? ` Note: "${adminNote}"` : '';
    return (0, exports.createNotification)(userId, type, `Your leave request (${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}) has been ${statusLabel} by ${reviewerName}.${noteText}`, '/hr/leaves');
};
exports.notifyLeaveStatus = notifyLeaveStatus;
// Notify all project members when a milestone is completed
const notifyMilestoneCompleted = async (projectId, milestoneTitle, completedByName) => {
    const members = await db_1.default.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
    });
    for (const member of members) {
        await (0, exports.createNotification)(member.userId, 'MILESTONE_COMPLETED', `Milestone "${milestoneTitle}" has been completed by ${completedByName}`, `/pm/projects/${projectId}`);
    }
};
exports.notifyMilestoneCompleted = notifyMilestoneCompleted;
//# sourceMappingURL=notification.service.js.map