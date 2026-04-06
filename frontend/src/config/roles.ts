/**
 * Global Role Definitions (mirrored from backend config/roles.ts)
 *
 * Hierarchy: admin > manager > hr > employee
 */

export const Role = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  HR: 'hr',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = (typeof Role)[keyof typeof Role];

/** Pre-built role groups for common permission checks */
export const RoleGroups = {
  /** Full system access */
  ADMIN_ONLY: [Role.ADMIN] as UserRole[],

  /** High-level management (Projects, PM-level access) */
  MANAGEMENT: [Role.ADMIN, Role.MANAGER] as UserRole[],

  /** HR related access */
  HR_ONLY: [Role.ADMIN, Role.HR] as UserRole[],

  /** Access to specialised tools (PM, HR) — everyone except employees */
  STAFF: [Role.ADMIN, Role.MANAGER, Role.HR] as UserRole[],

  /** Everyone */
  ALL: [Role.ADMIN, Role.MANAGER, Role.HR, Role.EMPLOYEE] as UserRole[],
};

/** Check whether a given role is in one of the pre-built groups */
export const hasRole = (role: string | undefined, group: readonly string[]): boolean =>
  !!role && group.includes(role);
