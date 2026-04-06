/**
 * Fine-grained Permission Definitions
 *
 * Format: module:action
 * Used by the RBAC system to control access at the API level.
 */
export declare const Permission: {
    readonly PROJECT_VIEW: "project:view";
    readonly PROJECT_CREATE: "project:create";
    readonly PROJECT_EDIT: "project:edit";
    readonly PROJECT_DELETE: "project:delete";
    readonly PROJECT_ARCHIVE: "project:archive";
    readonly PROJECT_MANAGE_MEMBERS: "project:manage_members";
    readonly TASK_VIEW: "task:view";
    readonly TASK_CREATE: "task:create";
    readonly TASK_EDIT: "task:edit";
    readonly TASK_DELETE: "task:delete";
    readonly TASK_ASSIGN: "task:assign";
    readonly USER_VIEW: "user:view";
    readonly USER_CREATE: "user:create";
    readonly USER_EDIT: "user:edit";
    readonly USER_DELETE: "user:delete";
    readonly USER_APPROVE: "user:approve";
    readonly USER_MANAGE_ROLES: "user:manage_roles";
    readonly DEPARTMENT_VIEW: "department:view";
    readonly DEPARTMENT_CREATE: "department:create";
    readonly DEPARTMENT_EDIT: "department:edit";
    readonly DEPARTMENT_DELETE: "department:delete";
    readonly ROLE_VIEW: "role:view";
    readonly ROLE_CREATE: "role:create";
    readonly ROLE_EDIT: "role:edit";
    readonly ROLE_DELETE: "role:delete";
    readonly ANALYTICS_VIEW: "analytics:view";
    readonly ACTIVITY_LOG_VIEW: "activity_log:view";
    readonly LEAVE_VIEW: "leave:view";
    readonly LEAVE_MANAGE: "leave:manage";
    readonly PAYROLL_VIEW: "payroll:view";
    readonly PAYROLL_MANAGE: "payroll:manage";
    readonly PERFORMANCE_VIEW: "performance:view";
    readonly PERFORMANCE_MANAGE: "performance:manage";
    readonly CLIENT_VIEW: "client:view";
    readonly CLIENT_CREATE: "client:create";
    readonly CLIENT_EDIT: "client:edit";
    readonly CLIENT_DELETE: "client:delete";
    readonly TEMPLATE_VIEW: "template:view";
    readonly TEMPLATE_CREATE: "template:create";
    readonly TEMPLATE_EDIT: "template:edit";
    readonly TEMPLATE_DELETE: "template:delete";
    readonly COMPANY_MANAGE: "company:manage";
    readonly COMPANY_SETTINGS: "company:settings";
    readonly FEATURE_TOGGLE: "feature:toggle";
};
export type PermissionKey = typeof Permission[keyof typeof Permission];
/**
 * All available permissions grouped by category for the UI
 */
export declare const PermissionGroups: Record<string, {
    label: string;
    permissions: {
        key: string;
        label: string;
    }[];
}>;
/**
 * Default permission sets for system roles.
 * Admins get all permissions. These are used when seeding default roles.
 */
export declare const DefaultRolePermissions: Record<string, string[]>;
/**
 * Default feature toggles for a new company
 */
export declare const DefaultFeatures: Record<string, boolean>;
//# sourceMappingURL=permissions.d.ts.map