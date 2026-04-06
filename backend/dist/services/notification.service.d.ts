type NotificationType = 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'MENTIONED' | 'DEADLINE_REMINDER' | 'PROJECT_ADDED' | 'PROJECT_UPDATED' | 'TASK_OVERDUE' | 'MILESTONE_COMPLETED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED';
export declare const createNotification: (userId: string, type: NotificationType, message: string, link?: string) => Promise<any>;
export declare const notifyTaskAssigned: (assigneeId: string, taskTitle: string, taskId: string, projectId: string, assignedByName: string) => Promise<any>;
export declare const notifyUserMentioned: (userId: string, taskTitle: string, taskId: string, projectId: string, mentionerName: string) => Promise<any>;
export declare const notifyStatusChanged: (userId: string, taskTitle: string, taskId: string, projectId: string, newStatus: string, changedByName: string) => Promise<any>;
export declare const notifyCommentAdded: (userId: string, taskTitle: string, taskId: string, projectId: string, commenterName: string) => Promise<any>;
export declare const notifyProjectAdded: (userId: string, projectName: string, projectId: string, addedByName: string) => Promise<any>;
export declare const notifyDeadlineReminder: (userId: string, taskTitle: string, taskId: string, projectId: string) => Promise<any>;
export declare const notifyProjectUpdated: (userId: string, projectName: string, projectId: string, updateDescription: string, updatedByName: string) => Promise<any>;
export declare const notifyLeaveStatus: (userId: string, status: "APPROVED" | "REJECTED", startDate: string, endDate: string, reviewerName: string, adminNote?: string) => Promise<any>;
export declare const notifyMilestoneCompleted: (projectId: string, milestoneTitle: string, completedByName: string) => Promise<void>;
export {};
//# sourceMappingURL=notification.service.d.ts.map