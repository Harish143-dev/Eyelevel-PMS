import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { DefaultFeatures, DefaultRolePermissions } from '../config/permissions';
import { logActivity } from '../services/activity.service';

/**
 * GET /api/onboarding/status
 * Returns the current onboarding state for the user's company.
 */
export const getOnboardingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      // User has no company — they need to start onboarding from step 1
      res.json({ setupCompleted: false, setupStep: 0, hasCompany: false });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        name: true,
        setupCompleted: true,
        setupStep: true,
        features: true,
        settings: true,
      },
    });

    if (!company) {
      res.json({ setupCompleted: false, setupStep: 0, hasCompany: false });
      return;
    }

    res.json({
      hasCompany: true,
      setupCompleted: company.setupCompleted,
      setupStep: company.setupStep,
      company: {
        id: company.id,
        name: company.name,
        features: company.features,
        settings: company.settings,
      },
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/onboarding/step-1 — Branding & Identity
 * Updates the company branding and business details.
 * Body: { businessType, address, primaryColor, logoUrl }
 */
export const onboardingStep1 = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { businessType, address, primaryColor, logoUrl } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(400).json({ message: 'No company found for this user' });
      return;
    }

    const companyId = user.companyId;

    // Update Company Settings
    await prisma.companySettings.update({
      where: { companyId },
      data: {
        businessType: businessType || null,
        address: address || null,
        primaryColor: primaryColor || '#1E40AF',
        logoUrl: logoUrl || null,
      },
    });

    // Advance to step 2
    await prisma.company.update({
      where: { id: companyId },
      data: { setupStep: 2 },
    });

    await logActivity(userId, 'ONBOARDING_STEP_1', 'company', companyId, `Updated branding and business identity`);

    res.json({ message: 'Step 1 completed', setupStep: 2, companyId });
  } catch (error) {
    console.error('Onboarding step 1 error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/onboarding/step-2 — Localization
 * Body: { country, timezone, currency, dateFormat }
 */
export const onboardingStep2 = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { country, timezone, currency, dateFormat } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(400).json({ message: 'Complete step 1 first' });
      return;
    }

    await prisma.companySettings.update({
      where: { companyId: user.companyId },
      data: {
        country: country || null,
        timezone: timezone || 'UTC',
        currency: currency || 'USD',
        dateFormat: dateFormat || 'YYYY-MM-DD',
      },
    });

    await prisma.company.update({
      where: { id: user.companyId },
      data: { setupStep: 3 },
    });

    await logActivity(userId, 'ONBOARDING_STEP_2', 'company', user.companyId, 'Configured localization');

    res.json({ message: 'Step 2 completed', setupStep: 3 });
  } catch (error) {
    console.error('Onboarding step 2 error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/onboarding/step-3 — Work Schedule
 * Body: { workDays, workHoursStart, workHoursEnd }
 */
export const onboardingStep3 = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { workDays, workHoursStart, workHoursEnd } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(400).json({ message: 'Complete step 1 first' });
      return;
    }

    await prisma.companySettings.update({
      where: { companyId: user.companyId },
      data: {
        workDays: workDays || [1, 2, 3, 4, 5],
        workHoursStart: workHoursStart || '09:00',
        workHoursEnd: workHoursEnd || '17:00',
      },
    });

    await prisma.company.update({
      where: { id: user.companyId },
      data: { setupStep: 4 },
    });

    await logActivity(userId, 'ONBOARDING_STEP_3', 'company', user.companyId, 'Configured work schedule');

    res.json({ message: 'Step 3 completed', setupStep: 4 });
  } catch (error) {
    console.error('Onboarding step 3 error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/onboarding/step-4 — Invite Team (optional)
 * Body: { emails: string[] }
 * 
 * For now this just stores the invitations. Actual email invitations
 * can be implemented later as an enhancement.
 */
export const onboardingStep4 = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { emails, features } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(400).json({ message: 'Complete step 1 first' });
      return;
    }

    // For now, we log the invited emails. In the future, this sends invitation emails.
    const invitedCount = Array.isArray(emails) ? emails.length : 0;

    const updateData: any = { setupStep: 5 };
    if (features) {
      updateData.features = features;
    }

    await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    });

    await logActivity(userId, 'ONBOARDING_STEP_4', 'company', user.companyId, `Invited ${invitedCount} team members and saved features`);

    res.json({ message: 'Step 4 completed', setupStep: 5, invitedCount });
  } catch (error) {
    console.error('Onboarding step 4 error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/onboarding/complete
 * Marks the company setup as completed.
 */
export const completeOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(400).json({ message: 'No company found' });
      return;
    }

    await prisma.company.update({
      where: { id: user.companyId },
      data: { setupCompleted: true },
    });

    await logActivity(userId, 'ONBOARDING_COMPLETED', 'company', user.companyId, 'Completed company onboarding');

    res.json({ message: 'Onboarding completed successfully', setupCompleted: true });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
