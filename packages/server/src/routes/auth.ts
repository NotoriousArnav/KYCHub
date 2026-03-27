import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { JWTPayload } from '../types/index.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/register', async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingMerchant = await prisma.merchant.findFirst({
      where: {
        OR: [{ email: data.email }, { slug: data.slug }],
      },
    });

    if (existingMerchant) {
      return res.status(400).json({ error: 'Email or slug already exists' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const merchant = await prisma.merchant.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email } as JWTPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({ merchant, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/login', async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const merchant = await prisma.merchant.findUnique({
      where: { email: data.email },
    });

    if (!merchant) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, merchant.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email } as JWTPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        email: merchant.email,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get('/me', async (req, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.merchantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        createdAt: true,
      },
    });

    if (!merchant) {
      return res.status(401).json({ error: 'Merchant not found' });
    }

    res.json({ merchant });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});
