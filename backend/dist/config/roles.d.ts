/**
 * Global Role Definitions
 *
 * Hierarchy: admin > manager > hr > employee
 */
export declare const Role: {
    readonly ADMIN: "admin";
    readonly MANAGER: "manager";
    readonly HR: "hr";
    readonly EMPLOYEE: "employee";
};
export type UserRole = typeof Role[keyof typeof Role];
export declare const RoleGroups: {
    ADMIN_ONLY: "admin"[];
    MANAGEMENT: ("admin" | "manager")[];
    HR_ONLY: ("admin" | "hr")[];
    STAFF: ("admin" | "manager" | "hr")[];
    ALL: ("admin" | "manager" | "hr" | "employee")[];
};
export declare const RoleRank: Record<string, number>;
export declare const isAdmin: (role?: string) => role is "admin";
export declare const isManager: (role?: string) => role is "manager";
export declare const isHR: (role?: string) => role is "hr";
export declare const isEmployee: (role?: string) => role is "employee";
export declare const isStaff: (role?: string) => role is "admin" | "manager" | "hr";
//# sourceMappingURL=roles.d.ts.map