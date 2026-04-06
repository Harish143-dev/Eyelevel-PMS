import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../services/activity.service';

// GET /api/clients
export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({
      where: req.user?.companyId ? { companyId: req.user.companyId } : {},
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    });
    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/clients/:id
export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id: id as string },
      include: {
        projects: {
          select: { id: true, name: true, status: true }
        }
      }
    });

    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    // TENANT ISOLATION
    if (req.user!.companyId && client.companyId && client.companyId !== req.user!.companyId) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/clients
export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, company: companyName, address } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Client name is required' });
      return;
    }

    const client = await prisma.client.create({
      data: { name, email, phone, companyName, address, companyId: req.user!.companyId || null }
    });

    await logActivity(req.user!.id, 'CLIENT_CREATED', 'client', client.id, `Created client ${name}`);

    res.status(201).json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/clients/:id
export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clientParams = id as string;
    const { name, email, phone, company: companyName, address, status } = req.body;

    const existing = await prisma.client.findUnique({ where: { id: clientParams } });
    if (!existing) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const client = await prisma.client.update({
      where: { id: clientParams },
      data: { name, email, phone, companyName, address, status }
    });

    await logActivity(req.user!.id, 'CLIENT_UPDATED', 'client', client.id, `Updated client ${client.name}`);

    res.json({ client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/clients/:id
export const deleteClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clientId = id as string;

    const existing = await prisma.client.findUnique({ 
      where: { id: clientId }, 
      include: { _count: { select: { projects: true } } } 
    }) as any;

    if (!existing) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    if (existing._count?.projects > 0) {
      res.status(400).json({ message: 'Cannot delete client with active projects' });
      return;
    }

    await prisma.client.delete({ where: { id: clientId } });

    await logActivity(req.user!.id, 'CLIENT_DELETED', 'client', clientId, `Deleted client ${existing.name}`);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
