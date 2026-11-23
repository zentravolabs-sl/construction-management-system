# BuildMaster ERP – Enterprise Construction Project Management & ERP SaaS

BuildMaster ERP is a complete, multi-tenant Construction Project Management & Financial ERP SaaS platform engineered for construction companies, civil contractors, builders, and engineering firms in Sri Lanka.

---

## 1. Business & Locale Configuration
- **Application Name**: BuildMaster ERP
- **Architecture**: Multi-Tenant SaaS with strict `organizationId` tenant data isolation
- **Default Currency**: `LKR` (Sri Lankan Rupees)
- **Timezone**: `Asia/Colombo`
- **Date Format**: `DD/MM/YYYY`
- **Subscription Tiers**: Starter, Professional, Enterprise (with 14-Day Free Trial)

---

## 2. Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Recharts
- **Backend**: Next.js Server Actions, Next.js Route Handlers, Zod Validation
- **Database & ORM**: PostgreSQL (Neon Serverless Postgres) + Prisma ORM (`Decimal` precision for financial and quantity fields)
- **Authentication & Authorization**: HTTP-Only JWT Session Auth + 11-Role RBAC/PBAC Permission Matrix + Security Audit Trail
- **Exports**: `jspdf` + `jspdf-autotable` for PDF exports, `xlsx` for Excel exports, and Print view

---

## 3. Demo Credentials (Password for all accounts: `Password123!`)
The login page (`/login`) also provides a one-click role switcher for instant testing:
- **Company Admin (Apex Constructions Lanka)**: `admin@apexconstructions.lk`
- **Project Manager**: `pm@apexconstructions.lk`
- **Resident Site Engineer**: `engineer@apexconstructions.lk`
- **Chief Financial Accountant**: `accountant@apexconstructions.lk`
- **Client Portal (Colombo Metro Properties PLC)**: `client@colomboproperties.lk`
- **Platform Super Admin**: `superadmin@buildmaster.lk`

---

## 4. Environment Configuration (`.env`)
```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-production-jwt-secret"
NEXT_PUBLIC_APP_NAME="BuildMaster ERP"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_CURRENCY="LKR"
NEXT_PUBLIC_DEFAULT_TIMEZONE="Asia/Colombo"

# Optional External Provider Credentials
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
PAYMENT_PROVIDER="PAYHERE_SANDBOX"
PAYMENT_MERCHANT_ID=""
PAYMENT_SECRET=""
```

---

## 5. Development, Testing & Deployment Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client & Push Schema to PostgreSQL
npx prisma generate
npx prisma db push

# Seed demo construction projects, BOQs, workforce, inventory & accounting records
npm run db:seed

# Run TypeScript check
npm run typecheck

# Run automated unit & database integration tests
npm test

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

