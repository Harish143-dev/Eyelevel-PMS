/**
 * Centralized Status and Priority Constants
 * 
 * These constants provide a single source of truth for all status and priority
 * related logic, labels, and colors across the application.
 */

// --- Task Status ---

export const TASK_STATUS = {
  PENDING: 'pending',
  ONGOING: 'ongoing',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatusValue = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const TASK_STATUS_CONFIG: Record<TaskStatusValue, { label: string; color: string; badgeVariant: any }> = {
  [TASK_STATUS.PENDING]: {
    label: 'Pending',
    color: '#94a3b8',
    badgeVariant: 'gray',
  },
  [TASK_STATUS.ONGOING]: {
    label: 'Ongoing',
    color: '#3b82f6',
    badgeVariant: 'blue',
  },
  [TASK_STATUS.IN_REVIEW]: {
    label: 'In Review',
    color: '#f59e0b',
    badgeVariant: 'amber',
  },
  [TASK_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#10b981',
    badgeVariant: 'success',
  },
  [TASK_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: '#ef4444',
    badgeVariant: 'red',
  },
};

export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
}));

// --- Task Priority ---

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriorityValue = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

export const TASK_PRIORITY_CONFIG: Record<TaskPriorityValue, { label: string; color: string; badgeVariant: any }> = {
  [TASK_PRIORITY.LOW]: {
    label: 'Low',
    color: '#10b981',
    badgeVariant: 'success',
  },
  [TASK_PRIORITY.MEDIUM]: {
    label: 'Medium',
    color: '#f59e0b',
    badgeVariant: 'amber',
  },
  [TASK_PRIORITY.HIGH]: {
    label: 'High',
    color: '#ef4444',
    badgeVariant: 'red',
  },
  [TASK_PRIORITY.CRITICAL]: {
    label: 'Critical',
    color: '#7f1d1d',
    badgeVariant: 'indigo', // Or a custom red variant
  },
};

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
}));

// --- Project Status ---

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
} as const;

export type ProjectStatusValue = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

export const PROJECT_STATUS_CONFIG: Record<ProjectStatusValue, { label: string; color: string; badgeVariant: any }> = {
  [PROJECT_STATUS.PLANNING]: {
    label: 'Planning',
    color: '#94a3b8',
    badgeVariant: 'gray',
  },
  [PROJECT_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3b82f6',
    badgeVariant: 'blue',
  },
  [PROJECT_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#10b981',
    badgeVariant: 'success',
  },
  [PROJECT_STATUS.ON_HOLD]: {
    label: 'On Hold',
    color: '#f59e0b',
    badgeVariant: 'amber',
  },
};

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
}));

// --- User Status ---

export const USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REJECTED: 'REJECTED',
} as const;

export type UserStatusValue = typeof USER_STATUS[keyof typeof USER_STATUS];

export const USER_STATUS_CONFIG: Record<UserStatusValue, { label: string; color: string; badgeVariant: any }> = {
  [USER_STATUS.PENDING]: { label: 'Pending', color: '#94a3b8', badgeVariant: 'gray' },
  [USER_STATUS.ACTIVE]: { label: 'Active', color: '#10b981', badgeVariant: 'success' },
  [USER_STATUS.INACTIVE]: { label: 'Inactive', color: '#ef4444', badgeVariant: 'red' },
  [USER_STATUS.REJECTED]: { label: 'Rejected', color: '#7f1d1d', badgeVariant: 'indigo' },
};

// --- Leave Status ---

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type LeaveStatusValue = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];

export const LEAVE_STATUS_CONFIG: Record<LeaveStatusValue, { label: string; color: string; badgeVariant: any }> = {
  [LEAVE_STATUS.PENDING]: { label: 'Pending', color: '#f59e0b', badgeVariant: 'amber' },
  [LEAVE_STATUS.APPROVED]: { label: 'Approved', color: '#10b981', badgeVariant: 'success' },
  [LEAVE_STATUS.REJECTED]: { label: 'Rejected', color: '#ef4444', badgeVariant: 'red' },
};

// --- Milestone Status ---

export const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type MilestoneStatusValue = typeof MILESTONE_STATUS[keyof typeof MILESTONE_STATUS];

export const MILESTONE_STATUS_CONFIG: Record<MilestoneStatusValue, { label: string; color: string; badgeVariant: any }> = {
  [MILESTONE_STATUS.PENDING]: { label: 'Pending', color: '#94a3b8', badgeVariant: 'gray' },
  [MILESTONE_STATUS.IN_PROGRESS]: { label: 'In Progress', color: '#3b82f6', badgeVariant: 'blue' },
  [MILESTONE_STATUS.COMPLETED]: { label: 'Completed', color: '#10b981', badgeVariant: 'success' },
};

// --- Todo Priority ---

export const TODO_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TodoPriorityValue = typeof TODO_PRIORITY[keyof typeof TODO_PRIORITY];

export const TODO_PRIORITY_CONFIG: Record<TodoPriorityValue, { label: string; color: string; textColor: string }> = {
  [TODO_PRIORITY.LOW]: { label: 'Low', color: '#94a3b8', textColor: 'text-text-muted' },
  [TODO_PRIORITY.MEDIUM]: { label: 'Med', color: '#3b82f6', textColor: 'text-info' },
  [TODO_PRIORITY.HIGH]: { label: 'High', color: '#f59e0b', textColor: 'text-warning' },
};

export const TODO_PRIORITY_OPTIONS = Object.entries(TODO_PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
}));

export const MILESTONE_STATUS_OPTIONS = Object.entries(MILESTONE_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
}));
