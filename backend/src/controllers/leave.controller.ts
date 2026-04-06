import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { notifyLeaveStatus } from '../services/notification.service';

export const getMyLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaves = await (prisma as any).leaveRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ leaves });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    
    // Basic validation
    if (!startDate || !endDate || !type || !reason) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      res.status(400).json({ message: 'End date cannot be earlier than start date' });
      return;
    }

    const leave = await (prisma as any).leaveRequest.create({
      data: {
        userId: req.user!.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        reason,
        status: 'PENDING',
      },
    });

    res.status(201).json({ leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaves = await (prisma as any).leaveRequest.findMany({
      include: {
        user: { select: { id: true, name: true, avatarColor: true, designation: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ leaves });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const leave = await (prisma as any).leaveRequest.update({
      where: { id },
      data: { status, adminNote },
    });

    // Send notification to the employee
    try {
      await notifyLeaveStatus(
        leave.userId,
        status,
        leave.startDate.toISOString(),
        leave.endDate.toISOString(),
        req.user!.name,
        adminNote
      );
    } catch (e) {
      console.error('Failed to send leave notification:', e);
    }

    res.json({ leave });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
