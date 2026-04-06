"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubtaskSchema = exports.addDependencySchema = exports.updateStatusSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const uuidSchema = zod_1.z.string().uuid('Must be a valid UUID');
const optionalUUID = zod_1.z.preprocess((val) => (val === '' ? null : val), zod_1.z.string().uuid('Must be a valid UUID').optional().nullable());
const VALID_TASK_STATUSES = ['pending', 'ongoing', 'in_review', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
exports.createTaskSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema, // projectId from route /projects/:id/tasks
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Task title is required').max(300, 'Title must be under 300 characters'),
        description: zod_1.z.string().max(10000, 'Description too long').optional().nullable(),
        assignedTo: optionalUUID,
        dueDate: zod_1.z.string().optional().nullable(),
        priority: zod_1.z.enum(VALID_PRIORITIES).optional(),
        status: zod_1.z.enum(VALID_TASK_STATUSES).optional(),
        milestoneId: optionalUUID,
        parentTaskId: optionalUUID,
        customFields: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().nullable(),
        customStatusId: optionalUUID,
        customPriorityId: optionalUUID,
        position: zod_1.z.number().optional().nullable(),
        recurringRule: zod_1.z.string().optional().nullable(),
    }),
});
exports.updateTaskSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(300).optional(),
        description: zod_1.z.string().max(10000).optional().nullable(),
        assignedTo: optionalUUID,
        dueDate: zod_1.z.string().optional().nullable(),
        priority: zod_1.z.enum(VALID_PRIORITIES).optional(),
        status: zod_1.z.enum(VALID_TASK_STATUSES).optional(),
        milestoneId: optionalUUID,
        customFields: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().nullable(),
        customStatusId: optionalUUID,
        customPriorityId: optionalUUID,
        position: zod_1.z.number().optional().nullable(),
        recurringRule: zod_1.z.string().optional().nullable(),
    }),
});
exports.updateStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema,
    }),
    body: zod_1.z.object({
        // Allow either a standard status string OR a UUID (for custom workflow statuses)
        status: zod_1.z.union([
            zod_1.z.enum(VALID_TASK_STATUSES),
            zod_1.z.string().uuid('Must be a valid status or custom status UUID'),
        ]),
    }),
});
exports.addDependencySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema,
    }),
    body: zod_1.z.object({
        blockingTaskId: uuidSchema,
    }),
});
exports.createSubtaskSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: uuidSchema, // parentTaskId
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Subtask title is required').max(300),
        assignedTo: optionalUUID,
        dueDate: zod_1.z.string().optional().nullable(),
        priority: zod_1.z.enum(VALID_PRIORITIES).optional(),
        customFields: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().nullable(),
    }),
});
//# sourceMappingURL=task.validator.js.map