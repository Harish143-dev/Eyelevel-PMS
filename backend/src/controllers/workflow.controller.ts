import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/workflow/statuses
export const getStatuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.json([]);
      return;
    }

    const statuses = await prisma.customTaskStatus.findMany({
      where: { companyId },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(statuses);
  } catch (error) {
    console.error('getStatuses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/workflow/statuses
export const createStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ message: 'No company found' }); return; }

    const { name, color, standardStatus } = req.body;
    if (!name || !color) { res.status(400).json({ message: 'Name and color are required' }); return; }

    const highest = await prisma.customTaskStatus.findFirst({
      where: { companyId },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = highest ? highest.orderIndex + 1 : 1;

    const status = await prisma.customTaskStatus.create({
      data: { companyId, name, color, orderIndex, isDefault: false, standardStatus: standardStatus || 'ongoing' },
    });

    res.status(201).json(status);
  } catch (error) {
    console.error('createStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/workflow/statuses/:id
export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ message: 'No company found' }); return; }

    const id = req.params.id as string;
    const { name, color, standardStatus } = req.body;

    const existing = await prisma.customTaskStatus.findFirst({ where: { id, companyId } });
    if (!existing) { res.status(404).json({ message: 'Status not found' }); return; }

    const updated = await prisma.customTaskStatus.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(standardStatus !== undefined && { standardStatus }),
      },
    });

    // If category changed, sync all tasks using this status
    if (standardStatus !== undefined && standardStatus !== existing.standardStatus) {
      await prisma.task.updateMany({
        where: { customStatusId: id },
        data: { status: standardStatus as any },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('updateStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/workflow/statuses/:id
export const deleteStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ message: 'No company found' }); return; }

    const id = req.params.id as string;

    const existing = await prisma.customTaskStatus.findFirst({ where: { id, companyId } });
    if (!existing) { res.status(404).json({ message: 'Status not found' }); return; }

    // Move tasks using this custom status back to standard 'pending'
    await prisma.task.updateMany({
      where: { customStatusId: id },
      data: { customStatusId: null, status: 'pending' },
    });

    await prisma.customTaskStatus.delete({ where: { id } });

    res.json({ message: 'Status deleted. Tasks reverted to Pending.' });
  } catch (error) {
    console.error('deleteStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/workflow/statuses/reorder
export const reorderStatuses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return;

    const { updates } = req.body as { updates: { id: string; orderIndex: number }[] };

    await prisma.$transaction(
      updates.map((u) =>
        prisma.customTaskStatus.update({
          where: { id: u.id, companyId },
          data: { orderIndex: u.orderIndex },
        }),
      ),
    );

    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    console.error('reorderStatuses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/workflow/priorities
export const getPriorities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.json([]);
      return;
    }

    const priorities = await prisma.customTaskPriority.findMany({
      where: { companyId },
      orderBy: { orderIndex: 'asc' },
    });
    res.json(priorities);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/workflow/priorities
export const createPriority = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ message: 'No company found' }); return; }

    const { name, color, icon } = req.body;
    if (!name || !color) { res.status(400).json({ message: 'Name and color are required' }); return; }

    const highest = await prisma.customTaskPriority.findFirst({
      where: { companyId },
      orderBy: { orderIndex: 'desc' },
    });
    const orderIndex = highest ? highest.orderIndex + 1 : 1;

    const priority = await prisma.customTaskPriority.create({
      data: { companyId, name, color, icon: icon || null, orderIndex },
    });

    res.status(201).json(priority);
  } catch (error) {
    console.error('createPriority error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/workflow/priorities/:id
export const updatePriority = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ message: 'No company found' }); return; }

    const id = req.params.id as string;
    const { name, color, icon } = req.body;

    const existing = await prisma.customTaskPriority.findFirst({ where: { id, companyId } });
    if (!existing) { res.status(404).json({ message: 'Priority not found' }); return; }

    const updated = await prisma.customTaskPriority.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('updatePriority error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/workflow/priorities/:id
export const deletePriority = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(400).json({ message: 'No company found' }); return; }

    const id = req.params.id as string;

    const existing = await prisma.customTaskPriority.findFirst({ where: { id, companyId } });
    if (!existing) { res.status(404).json({ message: 'Priority not found' }); return; }

    // Move tasks using this custom priority back to standard 'medium'
    await prisma.task.updateMany({
      where: { customPriorityId: id },
      data: { customPriorityId: null, priority: 'medium' },
    });

    await prisma.customTaskPriority.delete({ where: { id } });

    res.json({ message: 'Priority deleted. Tasks reverted to Medium.' });
  } catch (error) {
    console.error('deletePriority error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/workflow/priorities/reorder
export const reorderPriorities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return;

    const { updates } = req.body as { updates: { id: string; orderIndex: number }[] };

    await prisma.$transaction(
      updates.map((u) =>
        prisma.customTaskPriority.update({
          where: { id: u.id, companyId },
          data: { orderIndex: u.orderIndex },
        }),
      ),
    );

    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    console.error('reorderPriorities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

