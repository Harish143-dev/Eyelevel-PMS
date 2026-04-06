import prisma from '../config/db';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
}

export const validatePasswordWithSettings = async (password: string, companyId: string | null): Promise<{ valid: boolean; message?: string }> => {
  // If no companyId (super admin or creating first admin during signup),
  // enforce a safe default strong policy.
  let policy: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true,
  };

  if (companyId) {
    const settings = await prisma.companySettings.findUnique({
      where: { companyId },
      select: { passwordPolicy: true }
    });
    
    if (settings?.passwordPolicy) {
      const dbPolicy = settings.passwordPolicy as any;
      policy = {
        minLength: dbPolicy.minLength || 8,
        requireUppercase: !!dbPolicy.requireUppercase,
        requireNumber: !!dbPolicy.requireNumber,
        requireSpecialChar: !!dbPolicy.requireSpecialChar,
      };
    }
  }

  if (password.length < policy.minLength) {
    return { valid: false, message: `Password must be at least ${policy.minLength} characters long.` };
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }

  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }

  if (policy.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }

  return { valid: true };
};
