# KYC Application Specification

## Project Overview
- **Project Name**: Multi-Tenant KYC Platform
- **Type**: Full-stack Web Application
- **Core Functionality**: Centralized user management with per-merchant KYC data isolation
- **Target Users**: Merchants needing KYC verification, end-users completing verification

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (merchants), token-based (KYC links)
- **File Storage**: MinIO S3 (localhost:9000, bucket: kyc)
- **File Uploads**: Multer + AWS SDK S3

## Database Schema

### User (Global Registry)
```
- id: UUID (primary key)
- name: String
- email: String (unique)
- phone: String?
- passwordHash: String
- createdAt: DateTime
```

### Merchant
```
- id: UUID (primary key)
- name: String
- slug: String (unique)
- email: String (unique)
- passwordHash: String
- createdAt: DateTime
```

### MerchantKYC
```
- id: UUID (primary key)
- merchantId: UUID (foreign key → Merchant)
- userId: UUID (foreign key → User)
- status: Enum (pending, approved, rejected)
- kycData: JSON (name, email, phone, address, idType, idNumber)
- idFrontUrl: String?
- idBackUrl: String?
- selfieUrl: String?
- reviewedBy: UUID? (foreign key → Merchant)
- createdAt: DateTime
- updatedAt: DateTime
```

### KYCRequestToken
```
- id: UUID (primary key)
- merchantId: UUID (foreign key → Merchant)
- userId: UUID? (foreign key → User, nullable for new users)
- token: String (unique)
- expiresAt: DateTime
- usedAt: DateTime?
- createdAt: DateTime
```

## URL Structure
- `/` - Landing page with merchant login/register
- `/merchant/{slug}/kyc?token={verification_token}` - User KYC form
- `/dashboard/{slug}` - Merchant dashboard
- `/admin` - Admin panel (basic)

## UI/UX Specification

### Color Palette
- **Primary**: `#0F172A` (slate-900) - Main text, headers
- **Secondary**: `#1E293B` (slate-800) - Cards, sidebar
- **Accent**: `#3B82F6` (blue-500) - Buttons, links
- **Success**: `#22C55E` (green-500) - Approved status
- **Warning**: `#F59E0B` (amber-500) - Pending status
- **Danger**: `#EF4444` (red-500) - Rejected status
- **Background**: `#F8FAFC` (slate-50) - Page background
- **Surface**: `#FFFFFF` - Card backgrounds

### Typography
- **Font Family**: "DM Sans", sans-serif (headings), "Inter", sans-serif (body)
- **Headings**: 
  - H1: 32px, font-weight 700
  - H2: 24px, font-weight 600
  - H3: 18px, font-weight 600
- **Body**: 14px, font-weight 400
- **Small**: 12px, font-weight 400

### Spacing System
- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px, 48px

### Components
- **Buttons**: Primary (blue-500), Secondary (slate-200), Danger (red-500)
- **Cards**: White background, rounded-lg (8px), shadow-sm
- **Inputs**: Border slate-300, focus:ring-2 blue-500
- **Status Badges**: Rounded-full, colored background with white text

## Functionality Specification

### Merchant Portal
1. **Registration**: Email, password, name, unique slug
2. **Login**: Email + password → JWT token
3. **Dashboard**:
   - Stats: Total KYC, pending, approved, rejected
   - List of KYC submissions with filters
   - Generate KYC link button
4. **KYC Management**:
   - View submission details
   - Approve/Reject with notes

### User KYC Flow
1. **Landing** (via merchant link):
   - Token validation
   - If valid token with userId → show existing user data
   - If new user → show registration form
2. **Registration** (if new):
   - Name, email, phone, password
3. **KYC Form**:
   - Pre-filled data from global user (if returning)
   - Address, ID type (passport/driver_license/national_id), ID number
   - File uploads: ID front, ID back, selfie (base64 or URL)
4. **Submission**:
   - Create MerchantKYC record
   - Mark token as used

### Admin Panel
- List all merchants
- Basic CRUD operations

## API Endpoints

### Auth
- `POST /api/auth/register` - Merchant registration
- `POST /api/auth/login` - Merchant login
- `GET /api/auth/me` - Get current merchant

### Merchants
- `GET /api/merchants/:slug` - Get merchant by slug
- `GET /api/merchants` - List all merchants (admin)

### KYC Tokens
- `POST /api/kyc/tokens` - Generate new KYC link (merchant)
- `GET /api/kyc/verify/:token` - Verify token for user
- `POST /api/kyc/upload` - Upload file to S3 (multipart/form-data)

### User KYC
- `POST /api/kyc/submit` - Submit KYC (user)
- `GET /api/kyc/status/:merchantSlug` - Check KYC status (user)

### Merchant KYC Management
- `GET /api/kyc/merchant` - List merchant's KYC submissions
- `GET /api/kyc/merchant/:id` - Get KYC details
- `PATCH /api/kyc/merchant/:id/status` - Approve/reject KYC

### Users
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user

## Acceptance Criteria
1. ✅ Merchant can register and login
2. ✅ Merchant can generate unique KYC links
3. ✅ User can access KYC form via merchant link
4. ✅ Returning users have data pre-filled
5. ✅ New users can register and complete KYC
6. ✅ Merchant can view, approve, reject KYC submissions
7. ✅ Merchant can only see their own KYC data
8. ✅ Same user can have separate KYC records for different merchants
9. ✅ JWT authentication for merchants
10. ✅ Token-based verification for KYC links
