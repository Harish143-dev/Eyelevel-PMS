import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';
import { RoleGroups } from '../config/roles';

// --- OKRs ---

export const getOKRs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    // User can only view their own OKRs unless HR/Manager/Admin
    const role = req.user!.role;
    const canViewAll = RoleGroups.STAFF.includes(role as any);

    const whereClause: any = {};
    if (!canViewAll) {
      whereClause.userId = req.user!.id;
    } else if (userId) {
      whereClause.userId = userId as string;
    }

    const okrs = await prisma.oKR.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, avatarColor: true, designation: true }}
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ okrs });
  } catch (error) {
    console.error('Get OKRs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createOKR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, title, description, quarter } = req.body;

    // Only HR/Manager/Admin can create OKRs for others
    const role = req.user!.role;
    const isSelf = req.user!.id === userId;
    const canManage = RoleGroups.STAFF.includes(role as any);

    if (!isSelf && !canManage) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const okr = await prisma.oKR.create({
      data: { userId, title, description, quarter, progress: 0 }
    });

    await logActivity(req.user!.id, 'OKR_CREATED', 'okr', okr.id, `Created OKR: ${title}`);

    res.status(201).json({ okr });
  } catch (error) {
    console.error('Create OKR error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateOKR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const okrId = id as string;
    const { title, description, quarter, progress, status } = req.body;

    const existing = await prisma.oKR.findUnique({ where: { id: okrId } });
    if (!existing) {
      res.status(404).json({ message: 'OKR not found' });
      return;
    }

    const role = req.user!.role;
    const isSelf = req.user!.id === existing.userId;
    const canManage = RoleGroups.STAFF.includes(role as any);

    if (!isSelf && !canManage) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const okr = await prisma.oKR.update({
      where: { id: okrId },
      data: { title, description, quarter, progress, status }
    });

    res.json({ okr });
  } catch (error) {
    console.error('Update OKR error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteOKR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const okrId = id as string;
    const role = req.user!.role;

    if (!RoleGroups.STAFF.includes(role as any)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await prisma.oKR.delete({ where: { id: okrId } });
    
    res.json({ message: 'OKR deleted' });
  } catch (error) {
    console.error('Delete OKR error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// --- Performance Reviews ---

export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { revieweeId } = req.query;
    
    const role = req.user!.role;
    const canViewAll = RoleGroups.STAFF.includes(role as any);

    const whereClause: any = {};
    if (!canViewAll) {
       // Employees can only view their own reviews
       whereClause.revieweeId = req.user!.id;
    } else if (revieweeId) {
       whereClause.revieweeId = revieweeId as string;
    }

    const reviews = await prisma.performanceReview.findMany({
      where: whereClause,
      include: {
        reviewee: { select: { name: true, avatarColor: true }},
        reviewer: { select: { name: true, avatarColor: true }}
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { revieweeId, period, rating, feedback } = req.body;
    const reviewerId = req.user!.id;

    const role = req.user!.role;
    if (!RoleGroups.STAFF.includes(role as any)) {
      res.status(403).json({ message: 'Only managers and HR can create reviews' });
      return;
    }

    const review = await prisma.performanceReview.create({
      data: { revieweeId, reviewerId, period, rating: Number(rating), feedback, status: 'published' }
    });

    await logActivity(req.user!.id, 'REVIEW_CREATED', 'review', review.id, `Created Performance Review for ${period}`);

    res.status(201).json({ review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
