import { z } from 'zod';

const uuidSchema = z.string().uuid('Must be a valid UUID');
const optionalUUID = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().uuid('Must be a valid UUID').optional().nullable()
);

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').max(200, 'Project name must be under 200 characters'),
    description: z.string().max(5000, 'Description is too long').optional().nullable(),
    status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
    category: z.string().max(100).optional().nullable(),
    startDate: z.string().datetime({ offset: true }).optional().nullable()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional().nullable()),
    deadline: z.string().datetime({ offset: true }).optional().nullable()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'deadline must be YYYY-MM-DD').optional().nullable()),
    departmentId: optionalUUID,
    clientId: optionalUUID,
    templateId: optionalUUID,
    projectManagerId: optionalUUID,
    memberIds: z.array(z.string().uuid()).optional().default([]),
    otherDepartmentIds: z.array(z.string().uuid()).optional().default([]),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).optional(),
    category: z.string().max(100).optional().nullable(),
    startDate: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    departmentId: optionalUUID,
    clientId: optionalUUID,
    projectManagerId: optionalUUID,
    memberIds: z.array(z.string().uuid()).optional(),
    otherDepartmentIds: z.array(z.string().uuid()).optional(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    userId: uuidSchema,
    isProjectManager: z.boolean().optional(),
  }),
});
