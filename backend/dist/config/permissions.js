"use strict";
/**
 * Fine-grained Permission Definitions
 *
 * Format: module:action
 * Used by the RBAC system to control access at the API level.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultFeatures = exports.DefaultRolePermissions = exports.PermissionGroups = exports.Permission = void 0;
exports.Permission = {
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
};
/**
 * All available permissions grouped by category for the UI
 */
exports.PermissionGroups = {
    projects: {
        label: 'Project Management',
        permissions: [
            { key: exports.Permission.PROJECT_VIEW, label: 'View Projects' },
            { key: exports.Permission.PROJECT_CREATE, label: 'Create Projects' },
            { key: exports.Permission.PROJECT_EDIT, label: 'Edit Projects' },
            { key: exports.Permission.PROJECT_DELETE, label: 'Delete Projects' },
            { key: exports.Permission.PROJECT_ARCHIVE, label: 'Archive Projects' },
            { key: exports.Permission.PROJECT_MANAGE_MEMBERS, label: 'Manage Project Members' },
        ],
    },
    tasks: {
        label: 'Task Management',
        permissions: [
            { key: exports.Permission.TASK_VIEW, label: 'View Tasks' },
            { key: exports.Permission.TASK_CREATE, label: 'Create Tasks' },
            { key: exports.Permission.TASK_EDIT, label: 'Edit Tasks' },
            { key: exports.Permission.TASK_DELETE, label: 'Delete Tasks' },
            { key: exports.Permission.TASK_ASSIGN, label: 'Assign Tasks' },
        ],
    },
    users: {
        label: 'User Management',
        permissions: [
            { key: exports.Permission.USER_VIEW, label: 'View Users' },
            { key: exports.Permission.USER_CREATE, label: 'Create Users' },
            { key: exports.Permission.USER_EDIT, label: 'Edit Users' },
            { key: exports.Permission.USER_DELETE, label: 'Delete Users' },
            { key: exports.Permission.USER_APPROVE, label: 'Approve/Reject Users' },
            { key: exports.Permission.USER_MANAGE_ROLES, label: 'Manage User Roles' },
        ],
    },
    departments: {
        label: 'Department Management',
        permissions: [
            { key: exports.Permission.DEPARTMENT_VIEW, label: 'View Departments' },
            { key: exports.Permission.DEPARTMENT_CREATE, label: 'Create Departments' },
            { key: exports.Permission.DEPARTMENT_EDIT, label: 'Edit Departments' },
            { key: exports.Permission.DEPARTMENT_DELETE, label: 'Delete Departments' },
        ],
    },
    roles: {
        label: 'Roles Management',
        permissions: [
            { key: exports.Permission.ROLE_VIEW, label: 'View Roles' },
            { key: exports.Permission.ROLE_CREATE, label: 'Create Roles' },
            { key: exports.Permission.ROLE_EDIT, label: 'Edit Roles' },
            { key: exports.Permission.ROLE_DELETE, label: 'Delete Roles' },
        ],
    },
    reports: {
        label: 'Reports & Analytics',
        permissions: [
            { key: exports.Permission.ANALYTICS_VIEW, label: 'View Analytics' },
            { key: exports.Permission.ACTIVITY_LOG_VIEW, label: 'View Activity Logs' },
        ],
    },
    hr: {
        label: 'HR Module',
        permissions: [
            { key: exports.Permission.LEAVE_VIEW, label: 'View Leaves' },
            { key: exports.Permission.LEAVE_MANAGE, label: 'Manage Leaves' },
            { key: exports.Permission.PAYROLL_VIEW, label: 'View Payroll' },
            { key: exports.Permission.PAYROLL_MANAGE, label: 'Manage Payroll' },
            { key: exports.Permission.PERFORMANCE_VIEW, label: 'View Performance' },
            { key: exports.Permission.PERFORMANCE_MANAGE, label: 'Manage Performance' },
        ],
    },
    clients: {
        label: 'Client Management',
        permissions: [
            { key: exports.Permission.CLIENT_VIEW, label: 'View Clients' },
            { key: exports.Permission.CLIENT_CREATE, label: 'Create Clients' },
            { key: exports.Permission.CLIENT_EDIT, label: 'Edit Clients' },
            { key: exports.Permission.CLIENT_DELETE, label: 'Delete Clients' },
        ],
    },
    templates: {
        label: 'Template Management',
        permissions: [
            { key: exports.Permission.TEMPLATE_VIEW, label: 'View Templates' },
            { key: exports.Permission.TEMPLATE_CREATE, label: 'Create Templates' },
            { key: exports.Permission.TEMPLATE_EDIT, label: 'Edit Templates' },
            { key: exports.Permission.TEMPLATE_DELETE, label: 'Delete Templates' },
        ],
    },
    company: {
        label: 'Company Administration',
        permissions: [
            { key: exports.Permission.COMPANY_MANAGE, label: 'Manage Company' },
            { key: exports.Permission.COMPANY_SETTINGS, label: 'Company Settings' },
            { key: exports.Permission.FEATURE_TOGGLE, label: 'Toggle Features' },
        ],
    },
};
/**
 * Default permission sets for system roles.
 * Admins get all permissions. These are used when seeding default roles.
 */
exports.DefaultRolePermissions = {
    admin: Object.values(exports.Permission),
    manager: [
        exports.Permission.PROJECT_VIEW, exports.Permission.PROJECT_CREATE, exports.Permission.PROJECT_EDIT,
        exports.Permission.PROJECT_DELETE, exports.Permission.PROJECT_ARCHIVE, exports.Permission.PROJECT_MANAGE_MEMBERS,
        exports.Permission.TASK_VIEW, exports.Permission.TASK_CREATE, exports.Permission.TASK_EDIT,
        exports.Permission.TASK_DELETE, exports.Permission.TASK_ASSIGN,
        exports.Permission.USER_VIEW,
        exports.Permission.DEPARTMENT_VIEW,
        exports.Permission.ANALYTICS_VIEW,
        exports.Permission.CLIENT_VIEW, exports.Permission.CLIENT_CREATE, exports.Permission.CLIENT_EDIT,
        exports.Permission.TEMPLATE_VIEW, exports.Permission.TEMPLATE_CREATE, exports.Permission.TEMPLATE_EDIT, exports.Permission.TEMPLATE_DELETE,
        exports.Permission.LEAVE_VIEW,
        exports.Permission.PERFORMANCE_VIEW, exports.Permission.PERFORMANCE_MANAGE,
    ],
    hr: [
        exports.Permission.USER_VIEW, exports.Permission.USER_EDIT, exports.Permission.USER_APPROVE,
        exports.Permission.DEPARTMENT_VIEW, exports.Permission.DEPARTMENT_CREATE, exports.Permission.DEPARTMENT_EDIT, exports.Permission.DEPARTMENT_DELETE,
        exports.Permission.LEAVE_VIEW, exports.Permission.LEAVE_MANAGE,
        exports.Permission.PAYROLL_VIEW, exports.Permission.PAYROLL_MANAGE,
        exports.Permission.PERFORMANCE_VIEW, exports.Permission.PERFORMANCE_MANAGE,
        exports.Permission.PROJECT_VIEW, exports.Permission.TASK_VIEW,
    ],
    employee: [
        exports.Permission.PROJECT_VIEW,
        exports.Permission.TASK_VIEW, exports.Permission.TASK_CREATE, exports.Permission.TASK_EDIT,
        exports.Permission.LEAVE_VIEW,
        exports.Permission.PERFORMANCE_VIEW,
    ],
};
/**
 * Default feature toggles for a new company
 */
exports.DefaultFeatures = {
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
//# sourceMappingURL=permissions.js.map