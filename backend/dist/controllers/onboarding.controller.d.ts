import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * GET /api/onboarding/status
 * Returns the current onboarding state for the user's company.
 */
export declare const getOnboardingStatus: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/onboarding/step-1 — Branding & Identity
 * Updates the company branding and business details.
 * Body: { businessType, address, primaryColor, logoUrl }
 */
export declare const onboardingStep1: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/onboarding/step-2 — Localization
 * Body: { country, timezone, currency, dateFormat }
 */
export declare const onboardingStep2: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/onboarding/step-3 — Work Schedule
 * Body: { workDays, workHoursStart, workHoursEnd }
 */
export declare const onboardingStep3: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/onboarding/step-4 — Invite Team (optional)
 * Body: { emails: string[] }
 *
 * For now this just stores the invitations. Actual email invitations
 * can be implemented later as an enhancement.
 */
export declare const onboardingStep4: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * POST /api/onboarding/complete
 * Marks the company setup as completed.
 */
export declare const completeOnboarding: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=onboarding.controller.d.ts.map