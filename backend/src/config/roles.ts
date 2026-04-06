/**
 * Global Role Definitions
 * 
 * Hierarchy: admin > manager > hr > employee
 */

export const Role = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  HR: 'hr',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof Role[keyof typeof Role];

// Permission Helper Maps
export const RoleGroups = {
  // Can manage projects, members, tasks for any project
  ADMIN_ONLY: [Role.ADMIN],
  
  // High-level management (Projects, PM-level access)
  MANAGEMENT: [Role.ADMIN, Role.MANAGER],
  
  // HR related access
  HR_ONLY: [Role.ADMIN, Role.HR],
  
  // Access to specialized tools (PM, HR)
  STAFF: [Role.ADMIN, Role.MANAGER, Role.HR],
  
  // Everyone
  ALL: [Role.ADMIN, Role.MANAGER, Role.HR, Role.EMPLOYEE],
};

// Rank for authorization hierarchy checks
export const RoleRank: Record<string, number> = {
  [Role.ADMIN]: 40,
  [Role.MANAGER]: 30,
  [Role.HR]: 20,
  [Role.EMPLOYEE]: 10,
};

// Authorization Helper Functions
export const isAdmin = (role?: string) => role === Role.ADMIN;
export const isManager = (role?: string) => role === Role.MANAGER;
export const isHR = (role?: string) => role === Role.HR;
export const isEmployee = (role?: string) => role === Role.EMPLOYEE;
export const isStaff = (role?: string) => role === Role.ADMIN || role === Role.MANAGER || role === Role.HR;
