import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/monitoring/daily
export const getDailySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ message: 'No company attached to user' });
      return;
    }

    const targetDateStr = req.query.date as string;
    let targetDate = new Date();
    if (targetDateStr) {
      targetDate = new Date(targetDateStr);
    }
    targetDate.setUTCHours(0, 0, 0, 0);

    const summaries = await prisma.employeeMonitoring.findMany({
      where: { companyId, date: targetDate },
      include: {
        user: { select: { id: true, name: true, avatarColor: true, email: true, designation: true } },
      },
      orderBy: { firstLoginAt: 'asc' },
    });

    res.json(summaries);
  } catch (error) {
    console.error('getDailySummary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/monitoring/consent
// Allows users to accept the monitoring policy notice.
export const acceptConsent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { monitoringConsentShown: true },
    });

    res.json({ message: 'Consent acknowledged' });
  } catch (error) {
    console.error('acceptConsent error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
