"use strict";
/**
 * Global Role Definitions
 *
 * Hierarchy: admin > manager > hr > employee
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStaff = exports.isEmployee = exports.isHR = exports.isManager = exports.isAdmin = exports.RoleRank = exports.RoleGroups = exports.Role = void 0;
exports.Role = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    HR: 'hr',
    EMPLOYEE: 'employee',
};
// Permission Helper Maps
exports.RoleGroups = {
    // Can manage projects, members, tasks for any project
    ADMIN_ONLY: [exports.Role.ADMIN],
    // High-level management (Projects, PM-level access)
    MANAGEMENT: [exports.Role.ADMIN, exports.Role.MANAGER],
    // HR related access
    HR_ONLY: [exports.Role.ADMIN, exports.Role.HR],
    // Access to specialized tools (PM, HR)
    STAFF: [exports.Role.ADMIN, exports.Role.MANAGER, exports.Role.HR],
    // Everyone
    ALL: [exports.Role.ADMIN, exports.Role.MANAGER, exports.Role.HR, exports.Role.EMPLOYEE],
};
// Rank for authorization hierarchy checks
exports.RoleRank = {
    [exports.Role.ADMIN]: 40,
    [exports.Role.MANAGER]: 30,
    [exports.Role.HR]: 20,
    [exports.Role.EMPLOYEE]: 10,
};
// Authorization Helper Functions
const isAdmin = (role) => role === exports.Role.ADMIN;
exports.isAdmin = isAdmin;
const isManager = (role) => role === exports.Role.MANAGER;
exports.isManager = isManager;
const isHR = (role) => role === exports.Role.HR;
exports.isHR = isHR;
const isEmployee = (role) => role === exports.Role.EMPLOYEE;
exports.isEmployee = isEmployee;
const isStaff = (role) => role === exports.Role.ADMIN || role === exports.Role.MANAGER || role === exports.Role.HR;
exports.isStaff = isStaff;
//# sourceMappingURL=roles.js.map