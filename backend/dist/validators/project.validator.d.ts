import { z } from 'zod';
export declare const createProjectSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            planning: "planning";
            in_progress: "in_progress";
            on_hold: "on_hold";
        }>>;
        category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        startDate: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodNullable<z.ZodOptional<z.ZodString>>]>;
        deadline: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodNullable<z.ZodOptional<z.ZodString>>]>;
        departmentId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        clientId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        templateId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        projectManagerId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        memberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
        otherDepartmentIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProjectSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            planning: "planning";
            in_progress: "in_progress";
            on_hold: "on_hold";
        }>>;
        category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        deadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        departmentId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        clientId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        projectManagerId: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodNullable<z.ZodOptional<z.ZodString>>>;
        memberIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        otherDepartmentIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const addMemberSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        userId: z.ZodString;
        isProjectManager: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=project.validator.d.ts.map