import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

export const getCompanySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: 'No company attached' });
      return;
    }

    const settings = await prisma.companySettings.findUnique({
      where: { companyId }
    });
    
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, status: true, setupCompleted: true, features: true }
    });

    res.json({ company, settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateCompanySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: 'No company attached' });
      return;
    }

    const data = { ...req.body };

    // separate company fields
    const companyUpdateData: any = {};
    if (data.companyName) {
      companyUpdateData.name = data.companyName;
      delete data.companyName;
    }
    if (data.features) {
      companyUpdateData.features = data.features;
      delete data.features;
    }

    if (Object.keys(companyUpdateData).length > 0) {
      await prisma.company.update({
        where: { id: companyId },
        data: companyUpdateData
      });
    }

    const setObj: any = {};
    if (data.businessType !== undefined) setObj.businessType = data.businessType;
    if (data.address !== undefined) setObj.address = data.address;
    if (data.city !== undefined) setObj.city = data.city;
    if (data.state !== undefined) setObj.state = data.state;
    if (data.country !== undefined) setObj.country = data.country;
    if (data.website !== undefined) setObj.website = data.website;
    if (data.logoUrl !== undefined) setObj.logoUrl = data.logoUrl;
    if (data.timezone !== undefined) setObj.timezone = data.timezone;
    if (data.currency !== undefined) setObj.currency = data.currency;
    if (data.dateFormat !== undefined) setObj.dateFormat = data.dateFormat;
    if (data.timeFormat !== undefined) setObj.timeFormat = data.timeFormat;
    if (data.workDays !== undefined) setObj.workDays = data.workDays;
    if (data.workHoursStart !== undefined) setObj.workHoursStart = data.workHoursStart;
    if (data.workHoursEnd !== undefined) setObj.workHoursEnd = data.workHoursEnd;
    if (data.lateGraceMinutes !== undefined) setObj.lateGraceMinutes = Number(data.lateGraceMinutes);
    if (data.primaryColor !== undefined) setObj.primaryColor = data.primaryColor;
    if (data.emailFooterText !== undefined) setObj.emailFooterText = data.emailFooterText;
    if (data.notificationMatrix !== undefined) setObj.notificationMatrix = data.notificationMatrix;
    if (data.telegramBotToken !== undefined) setObj.telegramBotToken = data.telegramBotToken;
    if (data.telegramChatId !== undefined) setObj.telegramChatId = data.telegramChatId;
    
    // Security fields
    if (data.passwordPolicy !== undefined) setObj.passwordPolicy = data.passwordPolicy;
    if (data.sessionTimeout !== undefined) setObj.sessionTimeout = Number(data.sessionTimeout);
    if (data.require2fa !== undefined) setObj.require2fa = Boolean(data.require2fa);
    
    // HR fields
    if (data.halfDayThreshold !== undefined) setObj.halfDayThreshold = Number(data.halfDayThreshold);
    if (data.overtimeLimit !== undefined) setObj.overtimeLimit = Number(data.overtimeLimit);
    if (data.leaveCategories !== undefined) setObj.leaveCategories = data.leaveCategories;

    const settings = await prisma.companySettings.upsert({
      where: { companyId },
      create: { companyId, ...setObj },
      update: { ...setObj }
    });

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// PATCH /api/settings/company/features — Admin only, updates only feature flags
export const updateFeatures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: 'No company attached' });
      return;
    }

    const { features } = req.body;
    if (!features || typeof features !== 'object') {
      res.status(400).json({ error: 'A valid features object is required' });
      return;
    }

    // Merge with existing features to allow partial updates
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { features: true },
    });

    const existingFeatures = (company?.features as Record<string, boolean>) || {};
    const mergedFeatures = { ...existingFeatures, ...features };

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { features: mergedFeatures },
      select: { features: true },
    });

    // --- BUG-007 Fix: Audit log for every feature toggle ---
    // Build a human-readable list of what changed
    const changedKeys = Object.keys(features).filter(
      key => features[key] !== existingFeatures[key]
    );

    if (changedKeys.length > 0 && req.user?.id) {
      const summary = changedKeys
        .map(k => `${k}: ${features[k] ? 'enabled' : 'disabled'}`)
        .join(', ');

      await logActivity(
        req.user.id,
        'UPDATED_FEATURES',
        'company',
        companyId,
        `Module/feature settings updated — ${summary}`
      );
    }
    // --- End BUG-007 Fix ---

    res.json({ message: 'Features updated successfully', features: updated.features });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update features' });
  }
};
