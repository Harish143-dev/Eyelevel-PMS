"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusSchema = exports.updateRoleSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const roles_1 = require("../config/roles");
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is required'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        role: zod_1.z.enum([roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR, roles_1.Role.EMPLOYEE]),
        designation: zod_1.z.string().optional().nullable(),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name is required').optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        designation: zod_1.z.string().optional().nullable(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        joiningDate: zod_1.z.string().optional().nullable(),
        emergencyContact: zod_1.z.string().optional().nullable(),
        reportingManagerId: zod_1.z.string().uuid().optional().nullable(),
    }),
});
exports.updateRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        role: zod_1.z.enum([roles_1.Role.ADMIN, roles_1.Role.MANAGER, roles_1.Role.HR, roles_1.Role.EMPLOYEE]),
    }),
});
exports.updateStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        isActive: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=user.validator.js.map