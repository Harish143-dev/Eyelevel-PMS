import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

/**
 * GET /api/companies
 * List all companies (super admin / platform admin).
 */
export const getCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { users: true, projects: true } },
        settings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ companies });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:id
 * Get a single company's details.
 */
export const getCompanyById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: id as string },
      include: {
        settings: true,
        _count: { select: { users: true, projects: true, departments: true } },
      },
    });

    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.json({ company });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:id/features
 * Toggle features for a company.
 * Body: { features: { projectManagement: true, teamChat: false, ... } }
 */
export const updateCompanyFeatures = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { features } = req.body;

    if (!features || typeof features !== 'object') {
      res.status(400).json({ message: 'Features object is required' });
      return;
    }

    const company = await prisma.company.findUnique({ where: { id: id as string } });
    if (!company) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    // Merge with existing features
    const currentFeatures = (company.features as Record<string, boolean>) || {};
    const mergedFeatures = { ...currentFeatures, ...features };

    const updated = await prisma.company.update({
      where: { id: id as string },
      data: { features: mergedFeatures },
      include: { _count: { select: { users: true, projects: true } } },
    });

    await logActivity(
      req.user!.id,
      'FEATURES_UPDATED',
      'company',
      id as string,
      `Updated features for "${updated.name}"`
    );

    res.json({ company: updated, message: 'Features updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:id/status
 * Update a company's status (active, suspended, etc.)
 * Body: { status }
 */
export const updateCompanyStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
      res.status(400).json({ message: 'Valid status is required (active, suspended, inactive)' });
      return;
    }

    const updated = await prisma.company.update({
      where: { id: id as string },
      data: { status },
    });

    await logActivity(
      req.user!.id,
      'COMPANY_STATUS_CHANGED',
      'company',
      id as string,
      `Changed company "${updated.name}" status to ${status}`
    );

    res.json({ company: updated, message: `Company status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/my
 * Get the current user's company with full details.
 */
export const getMyCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'No company found' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        settings: true,
        _count: { select: { users: true, projects: true, departments: true, roles: true } },
      },
    });

    res.json({ company });
  } catch (error) {
    next(error);
  }
};
