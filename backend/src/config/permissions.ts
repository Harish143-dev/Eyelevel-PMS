/**
 * Fine-grained Permission Definitions
 * 
 * Format: module:action
 * Used by the RBAC system to control access at the API level.
 */

export const Permission = {
  // Project Management
  PROJECT_VIEW: 'project:view',
  PROJECT_CREATE: 'project:create',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',
  PROJECT_ARCHIVE: 'project:archive',
  PROJECT_MANAGE_MEMBERS: 'project:manage_members',

  // Task Management
  TASK_VIEW: 'task:view',
  TASK_CREATE: 'task:create',
  TASK_EDIT: 'task:edit',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',

  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_APPROVE: 'user:approve',
  USER_MANAGE_ROLES: 'user:manage_roles',

  // Department Management
  DEPARTMENT_VIEW: 'department:view',
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_EDIT: 'department:edit',
  DEPARTMENT_DELETE: 'department:delete',

  // Roles Management
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',

  // Reports & Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ACTIVITY_LOG_VIEW: 'activity_log:view',

  // HR Module
  LEAVE_VIEW: 'leave:view',
  LEAVE_MANAGE: 'leave:manage',
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_MANAGE: 'payroll:manage',
  PERFORMANCE_VIEW: 'performance:view',
  PERFORMANCE_MANAGE: 'performance:manage',

  // Client Management
  CLIENT_VIEW: 'client:view',
  CLIENT_CREATE: 'client:create',
  CLIENT_EDIT: 'client:edit',
  CLIENT_DELETE: 'client:delete',

  // Templates
  TEMPLATE_VIEW: 'template:view',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_EDIT: 'template:edit',
  TEMPLATE_DELETE: 'template:delete',

  // Company / Super Admin
  COMPANY_MANAGE: 'company:manage',
  COMPANY_SETTINGS: 'company:settings',
  FEATURE_TOGGLE: 'feature:toggle',
} as const;

export type PermissionKey = typeof Permission[keyof typeof Permission];

/**
 * All available permissions grouped by category for the UI
 */
export const PermissionGroups: Record<string, { label: string; permissions: { key: string; label: string }[] }> = {
  projects: {
    label: 'Project Management',
    permissions: [
      { key: Permission.PROJECT_VIEW, label: 'View Projects' },
      { key: Permission.PROJECT_CREATE, label: 'Create Projects' },
      { key: Permission.PROJECT_EDIT, label: 'Edit Projects' },
      { key: Permission.PROJECT_DELETE, label: 'Delete Projects' },
      { key: Permission.PROJECT_ARCHIVE, label: 'Archive Projects' },
      { key: Permission.PROJECT_MANAGE_MEMBERS, label: 'Manage Project Members' },
    ],
  },
  tasks: {
    label: 'Task Management',
    permissions: [
      { key: Permission.TASK_VIEW, label: 'View Tasks' },
      { key: Permission.TASK_CREATE, label: 'Create Tasks' },
      { key: Permission.TASK_EDIT, label: 'Edit Tasks' },
      { key: Permission.TASK_DELETE, label: 'Delete Tasks' },
      { key: Permission.TASK_ASSIGN, label: 'Assign Tasks' },
    ],
  },
  users: {
    label: 'User Management',
    permissions: [
      { key: Permission.USER_VIEW, label: 'View Users' },
      { key: Permission.USER_CREATE, label: 'Create Users' },
      { key: Permission.USER_EDIT, label: 'Edit Users' },
      { key: Permission.USER_DELETE, label: 'Delete Users' },
      { key: Permission.USER_APPROVE, label: 'Approve/Reject Users' },
      { key: Permission.USER_MANAGE_ROLES, label: 'Manage User Roles' },
    ],
  },
  departments: {
    label: 'Department Management',
    permissions: [
      { key: Permission.DEPARTMENT_VIEW, label: 'View Departments' },
      { key: Permission.DEPARTMENT_CREATE, label: 'Create Departments' },
      { key: Permission.DEPARTMENT_EDIT, label: 'Edit Departments' },
      { key: Permission.DEPARTMENT_DELETE, label: 'Delete Departments' },
    ],
  },
  roles: {
    label: 'Roles Management',
    permissions: [
      { key: Permission.ROLE_VIEW, label: 'View Roles' },
      { key: Permission.ROLE_CREATE, label: 'Create Roles' },
      { key: Permission.ROLE_EDIT, label: 'Edit Roles' },
      { key: Permission.ROLE_DELETE, label: 'Delete Roles' },
    ],
  },
  reports: {
    label: 'Reports & Analytics',
    permissions: [
      { key: Permission.ANALYTICS_VIEW, label: 'View Analytics' },
      { key: Permission.ACTIVITY_LOG_VIEW, label: 'View Activity Logs' },
    ],
  },
  hr: {
    label: 'HR Module',
    permissions: [
      { key: Permission.LEAVE_VIEW, label: 'View Leaves' },
      { key: Permission.LEAVE_MANAGE, label: 'Manage Leaves' },
      { key: Permission.PAYROLL_VIEW, label: 'View Payroll' },
      { key: Permission.PAYROLL_MANAGE, label: 'Manage Payroll' },
      { key: Permission.PERFORMANCE_VIEW, label: 'View Performance' },
      { key: Permission.PERFORMANCE_MANAGE, label: 'Manage Performance' },
    ],
  },
  clients: {
    label: 'Client Management',
    permissions: [
      { key: Permission.CLIENT_VIEW, label: 'View Clients' },
      { key: Permission.CLIENT_CREATE, label: 'Create Clients' },
      { key: Permission.CLIENT_EDIT, label: 'Edit Clients' },
      { key: Permission.CLIENT_DELETE, label: 'Delete Clients' },
    ],
  },
  templates: {
    label: 'Template Management',
    permissions: [
      { key: Permission.TEMPLATE_VIEW, label: 'View Templates' },
      { key: Permission.TEMPLATE_CREATE, label: 'Create Templates' },
      { key: Permission.TEMPLATE_EDIT, label: 'Edit Templates' },
      { key: Permission.TEMPLATE_DELETE, label: 'Delete Templates' },
    ],
  },
  company: {
    label: 'Company Administration',
    permissions: [
      { key: Permission.COMPANY_MANAGE, label: 'Manage Company' },
      { key: Permission.COMPANY_SETTINGS, label: 'Company Settings' },
      { key: Permission.FEATURE_TOGGLE, label: 'Toggle Features' },
    ],
  },
};

/**
 * Default permission sets for system roles.
 * Admins get all permissions. These are used when seeding default roles.
 */
export const DefaultRolePermissions: Record<string, string[]> = {
  admin: Object.values(Permission),
  manager: [
    Permission.PROJECT_VIEW, Permission.PROJECT_CREATE, Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE, Permission.PROJECT_ARCHIVE, Permission.PROJECT_MANAGE_MEMBERS,
    Permission.TASK_VIEW, Permission.TASK_CREATE, Permission.TASK_EDIT,
    Permission.TASK_DELETE, Permission.TASK_ASSIGN,
    Permission.USER_VIEW,
    Permission.DEPARTMENT_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.CLIENT_VIEW, Permission.CLIENT_CREATE, Permission.CLIENT_EDIT,
    Permission.TEMPLATE_VIEW, Permission.TEMPLATE_CREATE, Permission.TEMPLATE_EDIT, Permission.TEMPLATE_DELETE,
    Permission.LEAVE_VIEW,
    Permission.PERFORMANCE_VIEW, Permission.PERFORMANCE_MANAGE,
  ],
  hr: [
    Permission.USER_VIEW, Permission.USER_EDIT, Permission.USER_APPROVE,
    Permission.DEPARTMENT_VIEW, Permission.DEPARTMENT_CREATE, Permission.DEPARTMENT_EDIT, Permission.DEPARTMENT_DELETE,
    Permission.LEAVE_VIEW, Permission.LEAVE_MANAGE,
    Permission.PAYROLL_VIEW, Permission.PAYROLL_MANAGE,
    Permission.PERFORMANCE_VIEW, Permission.PERFORMANCE_MANAGE,
    Permission.PROJECT_VIEW, Permission.TASK_VIEW,
  ],
  employee: [
    Permission.PROJECT_VIEW,
    Permission.TASK_VIEW, Permission.TASK_CREATE, Permission.TASK_EDIT,
    Permission.ANALYTICS_VIEW,
    Permission.LEAVE_VIEW,
    Permission.PERFORMANCE_VIEW,
  ],
};

/**
 * Default feature toggles for a new company
 */
export const DefaultFeatures: Record<string, boolean> = {
  projectManagement: true,
  taskManagement: true,
  timeTracking: true,
  teamChat: true,
  calendar: true,
  hrManagement: true,
  leaveManagement: true,
  payroll: false,
  performance: true,
  clientManagement: true,
  templates: true,
  analytics: true,
  documents: true,
};
