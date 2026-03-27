import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types/index.js';
import { prisma } from '../lib/prisma.js';

export const authenticateMerchant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.merchantId },
      select: { id: true, email: true, name: true, slug: true },
    });

    if (!merchant) {
      return res.status(401).json({ error: 'Merchant not found' });
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.merchantId },
      select: { id: true, email: true, name: true, slug: true },
    });

    if (merchant) {
      req.merchant = merchant;
    }
    next();
  } catch {
    next();
  }
};
