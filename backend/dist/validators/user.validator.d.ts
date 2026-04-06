import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodEnum<{
            admin: "admin";
            manager: "manager";
            hr: "hr";
            employee: "employee";
        }>;
        designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        joiningDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        emergencyContact: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        reportingManagerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateRoleSchema: z.ZodObject<{
    body: z.ZodObject<{
        role: z.ZodEnum<{
            admin: "admin";
            manager: "manager";
            hr: "hr";
            employee: "employee";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    body: z.ZodObject<{
        isActive: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=user.validator.d.ts.map