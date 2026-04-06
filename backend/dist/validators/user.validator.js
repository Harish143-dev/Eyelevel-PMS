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
        currentPassword: zod_1.z.string().optional(), // Added for secure email/sensitive changes
        designation: zod_1.z.string().optional().nullable(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        joiningDate: zod_1.z.string().optional().nullable(),
        emergencyContact: zod_1.z.string().optional().nullable(),
        reportingManagerId: zod_1.z.string().uuid().optional().nullable(),
        phoneNumber: zod_1.z.string().optional().nullable(),
        bio: zod_1.z.string().optional().nullable(),
        dateOfBirth: zod_1.z.string().optional().nullable(),
        gender: zod_1.z.string().optional().nullable(),
        bloodGroup: zod_1.z.string().optional().nullable(),
        address: zod_1.z.string().optional().nullable(),
        githubUrl: zod_1.z.string().url().optional().nullable().or(zod_1.z.literal('')),
        twitterUrl: zod_1.z.string().url().optional().nullable().or(zod_1.z.literal('')),
        linkedinUrl: zod_1.z.string().url().optional().nullable().or(zod_1.z.literal('')),
        portfolioUrl: zod_1.z.string().url().optional().nullable().or(zod_1.z.literal('')),
        employeeId: zod_1.z.string().optional().nullable(),
        employmentType: zod_1.z.string().optional().nullable(),
        workLocation: zod_1.z.string().optional().nullable(),
        bankName: zod_1.z.string().optional().nullable(),
        accountNumber: zod_1.z.string().optional().nullable(),
        ifscCode: zod_1.z.string().optional().nullable(),
        panNumber: zod_1.z.string().optional().nullable(),
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