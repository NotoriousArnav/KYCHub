import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authenticateMerchant } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { uploadFile } from '../services/s3.js';

export const kycRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const tokenSchema = z.object({
  userId: z.string().uuid().optional(),
  expiresInHours: z.number().positive().default(72),
});

const submitSchema = z.object({
  token: z.string(),
  kycData: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    country: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  }),
  idDocuments: z.array(z.string()).optional(),
  passportPhotoUrl: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

kycRouter.post('/tokens', authenticateMerchant, async (req: AuthRequest, res: Response) => {
  try {
    const data = tokenSchema.parse(req.body);
    const merchantId = req.merchant!.id;

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiresInHours);

    const kycToken = await prisma.kYCRequestToken.create({
      data: {
        merchantId,
        userId: data.userId,
        token,
        expiresAt,
      },
    });

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { slug: true },
    });

    res.status(201).json({
      token: kycToken.token,
      expiresAt: kycToken.expiresAt,
      url: `/merchant/${merchant!.slug}/kyc?token=${kycToken.token}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

kycRouter.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { type } = req.query;
    const folder = typeof type === 'string' ? type : 'documents';

    const result = await uploadFile(req.file, folder);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
});

kycRouter.get('/verify/:token', async (req, res: Response) => {
  try {
    const { token } = req.params;

    const kycToken = await prisma.kYCRequestToken.findUnique({
      where: { token },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!kycToken) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    if (kycToken.usedAt) {
      return res.status(400).json({ error: 'Token already used' });
    }

    if (new Date() > kycToken.expiresAt) {
      return res.status(400).json({ error: 'Token expired' });
    }

    res.json({
      valid: true,
      merchant: kycToken.merchant,
      user: kycToken.user,
      token: kycToken.token,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

kycRouter.post('/submit', async (req, res: Response) => {
  try {
    const data = submitSchema.parse(req.body);

    const kycToken = await prisma.kYCRequestToken.findUnique({
      where: { token: data.token },
    });

    if (!kycToken) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    if (kycToken.usedAt) {
      return res.status(400).json({ error: 'Token already used' });
    }

    if (new Date() > kycToken.expiresAt) {
      return res.status(400).json({ error: 'Token expired' });
    }

    let userId = kycToken.userId;
    let isNewUser = false;

    if (!userId) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.kycData.email },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const passwordHash = await bcrypt.hash(uuidv4(), 10);

        const newUser = await prisma.user.create({
          data: {
            name: data.kycData.name,
            email: data.kycData.email,
            phone: data.kycData.phone,
            passwordHash,
          },
        });
        userId = newUser.id;
        isNewUser = true;
      }
    }

    const existingKYC = await prisma.merchantKYC.findFirst({
      where: {
        merchantId: kycToken.merchantId,
        userId,
      },
    });

    if (existingKYC) {
      await prisma.merchantKYC.update({
        where: { id: existingKYC.id },
        data: {
          status: 'PENDING',
          kycData: data.kycData,
          idDocuments: data.idDocuments || [],
          passportPhotoUrl: data.passportPhotoUrl,
          reviewedBy: null,
        },
      });
    } else {
      await prisma.merchantKYC.create({
        data: {
          merchantId: kycToken.merchantId,
          userId,
          status: 'PENDING',
          kycData: data.kycData,
          idDocuments: data.idDocuments || [],
          passportPhotoUrl: data.passportPhotoUrl,
        },
      });
    }

    await prisma.kYCRequestToken.update({
      where: { id: kycToken.id },
      data: { usedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully',
      isNewUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Submit KYC error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

kycRouter.get('/merchant', authenticateMerchant, async (req: AuthRequest, res: Response) => {
  try {
    const merchantId = req.merchant!.id;
    const { status, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = { merchantId };
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
      where.status = status;
    }

    const [kycs, total] = await Promise.all([
      prisma.merchantKYC.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.merchantKYC.count({ where }),
    ]);

    res.json({
      kycs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get merchant KYCs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

kycRouter.get('/merchant/:id', authenticateMerchant, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchant!.id;

    const kyc = await prisma.merchantKYC.findFirst({
      where: { id, merchantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!kyc) {
      return res.status(404).json({ error: 'KYC not found' });
    }

    res.json({ kyc });
  } catch (error) {
    console.error('Get KYC error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

kycRouter.patch('/merchant/:id/status', authenticateMerchant, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.merchant!.id;
    const data = updateStatusSchema.parse(req.body);

    const existingKYC = await prisma.merchantKYC.findFirst({
      where: { id, merchantId },
    });

    if (!existingKYC) {
      return res.status(404).json({ error: 'KYC not found' });
    }

    const kyc = await prisma.merchantKYC.update({
      where: { id },
      data: {
        status: data.status,
        reviewedBy: merchantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({ kyc });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update KYC status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

kycRouter.get('/status/:merchantSlug', async (req, res: Response) => {
  try {
    const { merchantSlug } = req.params;
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token required' });
    }

    const kycToken = await prisma.kYCRequestToken.findUnique({
      where: { token },
    });

    if (!kycToken || !kycToken.userId) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
      select: { id: true },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const kyc = await prisma.merchantKYC.findFirst({
      where: {
        merchantId: merchant.id,
        userId: kycToken.userId,
      },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!kyc) {
      return res.json({ status: 'NOT_STARTED' });
    }

    res.json(kyc);
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
