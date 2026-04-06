import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        assignedTo: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
            critical: "critical";
        }>>;
        status: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            pending: "pending";
            ongoing: "ongoing";
            in_review: "in_review";
            cancelled: "cancelled";
        }>>;
        milestoneId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        parentTaskId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        customFields: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        customStatusId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        customPriorityId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        position: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        recurringRule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateTaskSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        assignedTo: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
            critical: "critical";
        }>>;
        status: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            pending: "pending";
            ongoing: "ongoing";
            in_review: "in_review";
            cancelled: "cancelled";
        }>>;
        milestoneId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        customFields: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        customStatusId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        customPriorityId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        position: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        recurringRule: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        status: z.ZodUnion<readonly [z.ZodEnum<{
            completed: "completed";
            pending: "pending";
            ongoing: "ongoing";
            in_review: "in_review";
            cancelled: "cancelled";
        }>, z.ZodString]>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const addDependencySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        blockingTaskId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const createSubtaskSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodString;
        assignedTo: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        priority: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
            critical: "critical";
        }>>;
        customFields: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=task.validator.d.ts.map