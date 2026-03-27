import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const merchantPassword = await bcrypt.hash('merchant123', 10);
  
  const merchant1 = await prisma.merchant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      email: 'admin@acme.com',
      passwordHash: merchantPassword,
    },
  });

  const merchant2 = await prisma.merchant.upsert({
    where: { slug: 'globex-inc' },
    update: {},
    create: {
      name: 'Globex Inc',
      slug: 'globex-inc',
      email: 'admin@globex.com',
      passwordHash: merchantPassword,
    },
  });

  const userPassword = await bcrypt.hash('user123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      passwordHash: userPassword,
    },
  });

  await prisma.merchantKYC.upsert({
    where: {
      id: 'seed-kyc-1',
    },
    update: {},
    create: {
      id: 'seed-kyc-1',
      merchantId: merchant1.id,
      userId: user1.id,
      status: 'PENDING',
      kycData: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        country: 'United States',
        address: '123 Main St, New York, NY 10001',
      },
      idDocuments: ['https://example.com/id-front.jpg'],
      passportPhotoUrl: 'https://example.com/selfie.jpg',
    },
  });

  console.log('✅ Seed completed!');
  console.log('---');
  console.log('Merchant 1: admin@acme.com / merchant123');
  console.log('Merchant 2: admin@globex.com / merchant123');
  console.log('User: john@example.com / user123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
