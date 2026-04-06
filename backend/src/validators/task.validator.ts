import { z } from 'zod';

const uuidSchema = z.string().uuid('Must be a valid UUID');
const optionalUUID = z.preprocess((val) => (val === '' ? null : val), z.string().uuid('Must be a valid UUID').optional().nullable());

const VALID_TASK_STATUSES = ['pending', 'ongoing', 'in_review', 'completed', 'cancelled'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export const createTaskSchema = z.object({
  params: z.object({
    id: uuidSchema, // projectId from route /projects/:id/tasks
  }),
  body: z.object({
    title: z.string().min(1, 'Task title is required').max(300, 'Title must be under 300 characters'),
    description: z.string().max(10000, 'Description too long').optional().nullable(),
    assignedTo: optionalUUID,
    dueDate: z.string().optional().nullable(),
    priority: z.enum(VALID_PRIORITIES).optional(),
    status: z.enum(VALID_TASK_STATUSES).optional(),
    milestoneId: optionalUUID,
    parentTaskId: optionalUUID,
    customFields: z.record(z.string(), z.unknown()).optional().nullable(),
    customStatusId: optionalUUID,
    customPriorityId: optionalUUID,
    position: z.number().optional().nullable(),
    recurringRule: z.string().optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    title: z.string().min(1).max(300).optional(),
    description: z.string().max(10000).optional().nullable(),
    assignedTo: optionalUUID,
    dueDate: z.string().optional().nullable(),
    priority: z.enum(VALID_PRIORITIES).optional(),
    status: z.enum(VALID_TASK_STATUSES).optional(),
    milestoneId: optionalUUID,
    customFields: z.record(z.string(), z.unknown()).optional().nullable(),
    customStatusId: optionalUUID,
    customPriorityId: optionalUUID,
    position: z.number().optional().nullable(),
    recurringRule: z.string().optional().nullable(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    // Allow either a standard status string OR a UUID (for custom workflow statuses)
    status: z.union([
      z.enum(VALID_TASK_STATUSES),
      z.string().uuid('Must be a valid status or custom status UUID'),
    ]),
  }),
});

export const addDependencySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    blockingTaskId: uuidSchema,
  }),
});

export const createSubtaskSchema = z.object({
  params: z.object({
    id: uuidSchema, // parentTaskId
  }),
  body: z.object({
    title: z.string().min(1, 'Subtask title is required').max(300),
    assignedTo: optionalUUID,
    dueDate: z.string().optional().nullable(),
    priority: z.enum(VALID_PRIORITIES).optional(),
    customFields: z.record(z.string(), z.unknown()).optional().nullable(),
  }),
});
