import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/activity — Record a single heartbeat
export const recordHeartbeat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { sessionId, status, source, timestamp } = req.body;

    if (!sessionId || !status) {
      res.status(400).json({ message: 'sessionId and status are required' });
      return;
    }

    // Validate status
    const validStatuses = ['active', 'idle', 'break', 'offline'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    // Verify session belongs to user and is active
    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId, isActive: true },
    });

    if (!session) {
      res.status(404).json({ message: 'Active session not found' });
      return;
    }

    const now = new Date();
    const heartbeatTime = timestamp ? new Date(timestamp) : now;

    // Create heartbeat entry
    const heartbeat = await prisma.activityHeartbeat.create({
      data: {
        userId,
        sessionId,
        timestamp: heartbeatTime,
        status,
        source: source || 'heartbeat',
      },
    });

    // Update session's lastActiveAt
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { lastActiveAt: now },
    });

    res.status(201).json({ heartbeat });
  } catch (error) {
    console.error('Record heartbeat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/activity/batch — Record multiple heartbeats (offline queue flush)
export const recordBatchHeartbeats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { heartbeats } = req.body;

    if (!Array.isArray(heartbeats) || heartbeats.length === 0) {
      res.status(400).json({ message: 'heartbeats array is required' });
      return;
    }

    // Limit batch size
    if (heartbeats.length > 500) {
      res.status(400).json({ message: 'Maximum 500 heartbeats per batch' });
      return;
    }

    const data = heartbeats.map((hb: any) => ({
      userId,
      sessionId: hb.sessionId,
      timestamp: new Date(hb.timestamp),
      status: hb.status || 'active',
      source: hb.source || 'heartbeat',
    }));

    const result = await prisma.activityHeartbeat.createMany({
      data,
      skipDuplicates: true,
    });

    // Update session lastActiveAt to the most recent heartbeat
    const latestTimestamp = heartbeats.reduce((latest: string, hb: any) => {
      return hb.timestamp > latest ? hb.timestamp : latest;
    }, heartbeats[0].timestamp);

    if (heartbeats[0]?.sessionId) {
      await prisma.userSession.updateMany({
        where: { id: heartbeats[0].sessionId, userId },
        data: { lastActiveAt: new Date(latestTimestamp) },
      });
    }

    res.status(201).json({ count: result.count, message: `${result.count} heartbeats recorded` });
  } catch (error) {
    console.error('Batch heartbeat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/activity/summary/:userId — Get daily work summary
export const getDailySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.userId as string;
    const { date } = req.query;

    // Authorization: self or admin
    if (targetUserId !== req.user!.id && !['manager', 'admin'].includes(req.user!.role)) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // Check if pre-computed summary exists
    const existingSummary = await prisma.workSummary.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existingSummary) {
      res.json({ summary: existingSummary });
      return;
    }

    // Compute on-the-fly from heartbeats
    const heartbeats = await prisma.activityHeartbeat.findMany({
      where: {
        userId: targetUserId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: 'asc' },
    });

    const summary = computeSummaryFromHeartbeats(heartbeats);

    // Get attendance info
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: targetUserId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    res.json({
      summary: {
        userId: targetUserId,
        date: startOfDay.toISOString().split('T')[0],
        checkInTime: attendance?.checkIn || null,
        checkOutTime: attendance?.checkOut || null,
        ...summary,
        attendanceStatus: attendance?.status || 'absent',
      },
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/activity/my-status — Get current user's real-time activity status
export const getMyActivityStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get active session
    const activeSession = await prisma.userSession.findFirst({
      where: { userId, isActive: true },
      orderBy: { loginTime: 'desc' },
    });

    if (!activeSession) {
      res.json({ isOnline: false, status: 'offline', session: null });
      return;
    }

    // Get today's heartbeats for computing live summary
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const heartbeats = await prisma.activityHeartbeat.findMany({
      where: {
        userId,
        timestamp: { gte: startOfDay, lte: now },
      },
      orderBy: { timestamp: 'asc' },
    });

    const summary = computeSummaryFromHeartbeats(heartbeats);

    // Determine current status from lastActiveAt
    const elapsed = now.getTime() - new Date(activeSession.lastActiveAt).getTime();
    let currentStatus = 'active';
    if (elapsed > 20 * 60 * 1000) currentStatus = 'break';
    else if (elapsed > 5 * 60 * 1000) currentStatus = 'idle';

    res.json({
      isOnline: true,
      currentStatus,
      session: {
        id: activeSession.id,
        loginTime: activeSession.loginTime,
        lastActiveAt: activeSession.lastActiveAt,
      },
      todaySummary: summary,
    });
  } catch (error) {
    console.error('Get activity status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/activity/admin/team-summary — Get team summary for admin
export const getTeamSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // Get all work summaries for the day
    const summaries = await prisma.workSummary.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            designation: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { productiveTime: 'desc' },
    });

    // Get attendance stats
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      _count: true,
    });

    const totalUsers = await prisma.user.count({
      where: { isActive: true, status: 'ACTIVE' },
    });

    res.json({
      summaries,
      attendanceStats: attendanceStats.reduce((acc: any, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {}),
      totalUsers,
    });
  } catch (error) {
    console.error('Get team summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/activity/admin/live — Get live status of all active sessions
export const getAdminLiveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
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
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    const now = new Date().getTime();

    const liveStatuses = activeSessions.map(session => {
      const elapsed = now - new Date(session.lastActiveAt).getTime();
      let currentStatus = 'active';
      
      // If inactive for > 30 mins, might just be hanging (cron hasn't swept it yet) - mark offline
      if (elapsed > 30 * 60 * 1000) currentStatus = 'offline';
      else if (elapsed > 20 * 60 * 1000) currentStatus = 'break';
      else if (elapsed > 5 * 60 * 1000) currentStatus = 'idle';

      return {
        sessionId: session.id,
        userId: session.userId,
        user: session.user,
        deviceId: session.deviceId,
        ipAddress: session.ipAddress,
        loginTime: session.loginTime,
        lastActiveAt: session.lastActiveAt,
        currentStatus,
      };
    });

    res.json({ liveStatuses });
  } catch (error) {
    console.error('Get admin live status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/activity/admin/anomalies — Get list of suspicious work summaries
export const getAnomalies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = 7 } = req.query;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - Number(days));

    const anomalies = await prisma.workSummary.findMany({
      where: {
        hasAnomaly: true,
        date: { gte: sinceDate },
      },
      include: {
        user: { select: { id: true, name: true, avatarColor: true, designation: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    res.json({ anomalies });
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper: compute summary from heartbeat logs
function computeSummaryFromHeartbeats(heartbeats: any[]) {
  let activeTime = 0;
  let idleTime = 0;
  let breakTime = 0;
  let tooFastCount = 0;

  for (let i = 0; i < heartbeats.length - 1; i++) {
    const gap = (new Date(heartbeats[i + 1].timestamp).getTime() - new Date(heartbeats[i].timestamp).getTime()) / 1000;
    
    if (gap > 0 && gap < 30) {
      tooFastCount++;
    }

    // Cap gap at 5 minutes (300s) to avoid counting long disconnections
    const effectiveGap = Math.min(gap, 300);
    
    switch (heartbeats[i].status) {
      case 'active':
        activeTime += effectiveGap;
        break;
      case 'idle':
        idleTime += effectiveGap;
        break;
      case 'break':
        breakTime += effectiveGap;
        break;
    }
  }

  const totalSessionTime = activeTime + idleTime + breakTime;

  let hasAnomaly = false;
  let anomalyReason = null;

  if (activeTime > 8 * 60 * 60 && idleTime === 0) {
    hasAnomaly = true;
    anomalyReason = '8+ hours continuous active time with zero idle time';
  } else if (tooFastCount > 50) {
    hasAnomaly = true;
    anomalyReason = 'Suspiciously rapid heartbeats detected';
  }

  return {
    totalSessionTime: Math.round(totalSessionTime),
    totalActiveTime: Math.round(activeTime),
    totalIdleTime: Math.round(idleTime),
    totalBreakTime: Math.round(breakTime),
    productiveTime: Math.round(activeTime), // productive = active
    hasAnomaly,
    anomalyReason,
  };
}

// GET /api/activity/admin/export — Export work summaries as CSV
export const exportSummariesCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const summaries = await prisma.workSummary.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        user: { select: { name: true, email: true, designation: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const csvRows = [
      ['Name', 'Email', 'Designation', 'Date', 'Check In', 'Check Out', 'Attendance Status', 'Total Session Time (m)', 'Active Time (m)', 'Idle Time (m)', 'Break Time (m)', 'Has Anomaly']
    ];

    summaries.forEach(s => {
      csvRows.push([
        s.user?.name || 'Unknown',
        s.user?.email || 'Unknown',
        s.user?.designation || '',
        startOfDay.toISOString().split('T')[0],
        s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString() : 'N/A',
        s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString() : 'N/A',
        s.attendanceStatus || 'absent',
        (s.totalSessionTime / 60).toFixed(0),
        (s.totalActiveTime / 60).toFixed(0),
        (s.totalIdleTime / 60).toFixed(0),
        (s.totalBreakTime / 60).toFixed(0),
        s.hasAnomaly ? 'Yes' : 'No',
      ]);
    });

    const csvString = csvRows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="work-summary-${startOfDay.toISOString().split('T')[0]}.csv"`);
    res.send(csvString);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
