"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMemberSchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
const uuidSchema = zod_1.z.string().uuid('Must be a valid UUID');
const optionalUUID = zod_1.z.preprocess((val) => (val === '' ? null : val), zod_1.z.string().uuid('Must be a valid UUID').optional().nullable());
exports.createProjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Project name is required').max(200, 'Project name must be under 200 characters'),
        description: zod_1.z.string().max(5000, 'Description is too long').optional().nullable(),
        status: zod_1.z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
        category: zod_1.z.string().max(100).optional().nullable(),
        startDate: zod_1.z.string().datetime({ offset: true }).optional().nullable()
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional().nullable()),
        deadline: zod_1.z.string().datetime({ offset: true }).optional().nullable()
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'deadline must be YYYY-MM-DD').optional().nullable()),
        departmentId: optionalUUID,
        clientId: optionalUUID,
        templateId: optionalUUID,
        projectManagerId: optionalUUID,
        memberIds: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
        otherDepartmentIds: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]),
    }),
});
exports.updateProjectSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema,
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().max(5000).optional().nullable(),
        status: zod_1.z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
        category: zod_1.z.string().max(100).optional().nullable(),
        startDate: zod_1.z.string().optional().nullable(),
        deadline: zod_1.z.string().optional().nullable(),
        departmentId: optionalUUID,
        clientId: optionalUUID,
        projectManagerId: optionalUUID,
        memberIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
        otherDepartmentIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    }),
});
exports.addMemberSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema,
    }),
    body: zod_1.z.object({
        userId: uuidSchema,
        isProjectManager: zod_1.z.boolean().optional(),
    }),
});
//# sourceMappingURL=project.validator.js.map