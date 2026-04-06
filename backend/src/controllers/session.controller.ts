import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/session/login — Create a new session on user login
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { deviceId, tabId } = req.body;

    console.log(`createSession: Initiating session for user ${userId}, device ${deviceId}, tab ${tabId}`);

    if (!deviceId || !tabId) {
      console.warn('createSession: Missing deviceId or tabId');
      res.status(400).json({ message: 'deviceId and tabId are required' });
      return;
    }

    // Get IP address and ensure it fits in the DB column (max 45 chars)
    let ipAddress = req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
    if (ipAddress.length > 45) {
      ipAddress = ipAddress.substring(0, 45);
    }

    const now = new Date();

    try {
      const session = await prisma.userSession.create({
        data: {
          userId,
          deviceId,
          tabId,
          loginTime: now,
          lastActiveAt: now,
          isActive: true,
          ipAddress,
        },
      });

      console.log(`createSession: Session ${session.id} created successfully for user ${userId}`);
      res.status(201).json({ session });
    } catch (prismaError: any) {
      console.error('createSession: Prisma creation error:', prismaError);
      res.status(500).json({ 
        message: 'Database error creating session', 
        error: process.env.NODE_ENV === 'development' ? prismaError.message : 'Internal error' 
      });
    }
  } catch (error: any) {
    console.error('createSession: Global error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// POST /api/session/logout — End a session
export const endSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sessionId, reason } = req.body;

    if (!sessionId) {
      res.status(400).json({ message: 'sessionId is required' });
      return;
    }

    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId, isActive: true },
    });

    if (!session) {
      res.status(404).json({ message: 'Active session not found' });
      return;
    }

    const updated = await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        logoutTime: new Date(),
        isActive: false,
        logoutReason: reason || 'manual',
      },
    });

    res.json({ session: updated });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/session/active — Get current user's active sessions
export const getActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const sessions = await prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { loginTime: 'desc' },
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/session/force-logout — Admin force logout a specific session
export const forceLogoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ message: 'sessionId is required' });
      return;
    }

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive) {
      res.status(404).json({ message: 'Active session not found' });
      return;
    }

    const updated = await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        logoutTime: new Date(),
        isActive: false,
        logoutReason: 'forced',
      },
    });

    res.json({ session: updated, message: 'Session forcefully ended' });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/session/admin/online — Get all online users (admin only)
export const getOnlineUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeSessions = await prisma.userSession.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarColor: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    // Determine status based on lastActiveAt
    const now = Date.now();
    const IDLE_THRESHOLD = 5 * 60 * 1000;  // 5 minutes
    const BREAK_THRESHOLD = 20 * 60 * 1000; // 20 minutes

    const usersWithStatus = activeSessions.map((s) => {
      const elapsed = now - new Date(s.lastActiveAt).getTime();
      let activityStatus = 'active';
      if (elapsed > BREAK_THRESHOLD) activityStatus = 'break';
      else if (elapsed > IDLE_THRESHOLD) activityStatus = 'idle';

      return {
        sessionId: s.id,
        user: s.user,
        loginTime: s.loginTime,
        lastActiveAt: s.lastActiveAt,
        activityStatus,
        deviceId: s.deviceId,
        ipAddress: s.ipAddress,
      };
    });

    res.json({ onlineUsers: usersWithStatus });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
