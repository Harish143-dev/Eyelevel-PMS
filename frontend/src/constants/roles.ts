export const Role = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  HR: 'hr',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof Role[keyof typeof Role];

// Helper functions for checking access
export const isAdmin = (role?: string) => role === Role.ADMIN;
export const isManager = (role?: string) => role === Role.MANAGER;
export const isHR = (role?: string) => role === Role.HR;
export const isEmployee = (role?: string) => role === Role.EMPLOYEE;

// Combined role checks
export const isAdminOrManager = (role?: string) => role === Role.ADMIN || role === Role.MANAGER;
export const isStaff = (role?: string) => role === Role.ADMIN || role === Role.MANAGER || role === Role.HR;
