import { Request, Response, NextFunction } from 'express';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import prisma from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    companyId?: string;
  };
}

export const verifyJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: any;
    try {
      decoded = verify(token, process.env.JWT_ACCESS_SECRET!) as {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Token expired' });
        return;
      }
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true, status: true, companyId: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found or deactivated' });
      return;
    }

    if (!user.isActive || user.status !== 'ACTIVE') {
      res.status(401).json({ message: 'User not found or deactivated' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyId: user.companyId || undefined,
    };

    next();
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

