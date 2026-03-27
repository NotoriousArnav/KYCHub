# KYC Platform

A multi-tenant KYC (Know Your Customer) verification platform built with a monorepo architecture.

## Features

- **Multi-tenant architecture** - Single user, separate KYC records per merchant
- **Merchant Portal** - Register, login, generate KYC links, review submissions
- **User KYC Flow** - Simple form with passport photo and government ID uploads
- **Admin Panel** - View all merchants
- **File Storage** - MinIO/S3 compatible

## Tech Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **Backend**: Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Storage**: MinIO (S3-compatible)
- **Build**: Turborepo

## Getting Started

```bash
# Install dependencies
npm install

# Start development servers
npm run dev:backend  # http://localhost:3001
npm run dev:web      # http://localhost:5173

# Build for production
npm run build
```

## Project Structure

```
packages/
├── shared/   # Shared TypeScript types
├── server/   # Express API
└── client/   # React frontend
```

## Default Credentials (Seeded)

- Merchant 1: admin@acme.com / merchant123
- Merchant 2: admin@globex.com / merchant123

## Environment Variables

### Server (packages/server/.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kyc
JWT_SECRET=your-secret-key
PORT=3001
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=kyc
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_REGION=us-east-1
```

## API Endpoints

- `POST /api/auth/register` - Merchant registration
- `POST /api/auth/login` - Merchant login
- `POST /api/kyc/tokens` - Generate KYC link
- `POST /api/kyc/upload` - Upload document
- `POST /api/kyc/submit` - Submit KYC
- `GET /api/kyc/merchant` - List merchant KYC submissions
- `PATCH /api/kyc/merchant/:id/status` - Approve/reject KYC
