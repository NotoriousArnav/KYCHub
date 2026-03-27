import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateMerchant } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

export const merchantRouter = Router();

merchantRouter.get('/', async (req, res: Response) => {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ merchants });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

merchantRouter.get('/slug/:slug', async (req, res: Response) => {
  try {
    const { slug } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ merchant });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

merchantRouter.get('/stats', authenticateMerchant, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = req.merchant!.id;

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.merchantKYC.count({ where: { merchantId } }),
      prisma.merchantKYC.count({ where: { merchantId, status: 'PENDING' } }),
      prisma.merchantKYC.count({ where: { merchantId, status: 'APPROVED' } }),
      prisma.merchantKYC.count({ where: { merchantId, status: 'REJECTED' } }),
    ]);

    res.json({ total, pending, approved, rejected });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
