export interface PasswordPolicy {
    minLength: number;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
}
export declare const validatePasswordWithSettings: (password: string, companyId: string | null) => Promise<{
    valid: boolean;
    message?: string;
}>;
//# sourceMappingURL=security.d.ts.map