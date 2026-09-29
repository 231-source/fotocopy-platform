import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JWTPayload } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-key';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    next();
  };
};

export const requireStoreAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  const storeId = req.params.storeId || req.body?.storeId;
  if (!req.user || (req.user.storeId !== storeId && req.user.role !== 'OWNER')) {
    return res.status(403).json({ message: 'Akses ke toko ini ditolak' });
  }
  next();
};
