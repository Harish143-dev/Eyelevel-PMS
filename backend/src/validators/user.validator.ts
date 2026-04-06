import { z } from 'zod';
import { Role } from '../config/roles';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum([Role.ADMIN, Role.MANAGER, Role.HR, Role.EMPLOYEE]),
    designation: z.string().optional().nullable(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    currentPassword: z.string().optional(), // Added for secure email/sensitive changes
    designation: z.string().optional().nullable(),
    skills: z.array(z.string()).optional(),
    joiningDate: z.string().optional().nullable(),
    emergencyContact: z.string().optional().nullable(),
    reportingManagerId: z.string().uuid().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    bloodGroup: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    githubUrl: z.string().url().optional().nullable().or(z.literal('')),
    twitterUrl: z.string().url().optional().nullable().or(z.literal('')),
    linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
    portfolioUrl: z.string().url().optional().nullable().or(z.literal('')),
    employeeId: z.string().optional().nullable(),
    employmentType: z.string().optional().nullable(),
    workLocation: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    accountNumber: z.string().optional().nullable(),
    ifscCode: z.string().optional().nullable(),
    panNumber: z.string().optional().nullable(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum([Role.ADMIN, Role.MANAGER, Role.HR, Role.EMPLOYEE]),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});
