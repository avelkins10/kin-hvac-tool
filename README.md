# HVAC Proposal Builder

A full-stack transactional platform for creating, managing, and processing HVAC proposals with finance integration and e-signature capabilities.

## Features

- **Authentication & Authorization**: NextAuth.js with role-based access control (Super Admin, Company Admin, Sales Rep, Customer)
- **Proposal Management**: Create, edit, duplicate, and track proposals with version history
- **Company Configuration**: Admin portal for managing pricing, equipment, add-ons, materials, labor rates, and more
- **Finance Integration**: LightReach API integration for financing applications
- **E-Signature**: SignNow integration for digital agreement signing
- **Email Notifications**: Automated emails for proposals, signatures, and finance approvals
- **Customer Portal**: Public proposal viewing with secure access
- **Database**: PostgreSQL with Prisma ORM (Neon PostgreSQL recommended)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI**: React 19, Tailwind CSS, Radix UI
- **PDF Generation**: jsPDF
- **Email**: Nodemailer
- **Finance API**: LightReach
- **E-Signature**: SignNow

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database (Neon PostgreSQL recommended)
- Accounts for:
  - LightReach (finance API)
  - SignNow (e-signature)
  - SMTP email service (Gmail, SendGrid, etc.)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Neon PostgreSQL Database

1. Create a Neon account at https://console.neon.tech
2. Create a new project
3. Copy the connection string from the dashboard
4. The connection string format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for local)
- `OPENAI_API_KEY`: For nameplate analysis
- `LIGHTREACH_API_KEY`: LightReach finance API key
- `SIGNNOW_*`: SignNow API credentials (SIGNNOW_API_HOST, SIGNNOW_BASIC_TOKEN, SIGNNOW_USERNAME, SIGNNOW_PASSWORD, SIGNNOW_FROM_EMAIL)
- `SMTP_*`: Email service configuration

### 4. Set Up Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Create Initial Admin User

You'll need to create the first admin user and company. You can do this via:

1. Prisma Studio: `npx prisma studio`
2. Database seed script (create one if needed)
3. Direct database insert

Example SQL to create initial company and admin:

```sql
-- Create company
INSERT INTO "Company" (id, name, "createdAt", "updatedAt")
VALUES ('company-1', 'Your Company Name', NOW(), NOW());

-- Create admin user (password: Admin123!)
-- Note: Password should be hashed with bcrypt
INSERT INTO "User" (id, email, password, role, "companyId", "createdAt", "updatedAt")
VALUES ('user-1', 'admin@example.com', '$2a$12$hashedpasswordhere', 'COMPANY_ADMIN', 'company-1', NOW(), NOW());
```

To hash a password, use Node.js:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourPassword123!', 12);
console.log(hash);
```

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and sign in with your admin credentials.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth configuration
│   │   ├── proposals/               # Proposal CRUD APIs
│   │   ├── company/                 # Company configuration APIs
│   │   ├── finance/                 # Finance integration APIs
│   │   ├── signatures/              # E-signature APIs
│   │   └── webhooks/                # Webhook handlers
│   ├── auth/                        # Authentication pages
│   └── proposals/                   # Proposal pages
├── components/
│   ├── auth/                        # Authentication components
│   ├── proposals/                   # Proposal components
│   └── ui/                          # Reusable UI components
├── lib/
│   ├── db.ts                        # Prisma client
│   ├── auth.ts                      # Password utilities
│   ├── integrations/                # External API clients
│   ├── email/                       # Email service
│   └── templates/                   # PDF generators
├── prisma/
│   └── schema.prisma                # Database schema
└── src/
    ├── components/                  # Main application components
    └── contexts/                    # React contexts
```

## Database Schema

The application uses the following main entities:

- **User**: Authentication and user management
- **Company**: Multi-tenant company isolation
- **Proposal**: Core proposal data with status workflow
- **ProposalVersion**: Version history for proposals
- **HVACSystem, AddOn, Material, etc.**: Company-specific configuration
- **FinanceApplication**: Finance application tracking
- **SignatureRequest**: E-signature request tracking
- **Payment**: Payment transaction records

## API Routes

### Authentication
- `POST /api/auth/signin` - Sign in
- `GET /api/auth/session` - Get current session

### Proposals
- `GET /api/proposals` - List proposals (with filters)
- `POST /api/proposals` - Create proposal
- `GET /api/proposals/[id]` - Get proposal details
- `PATCH /api/proposals/[id]` - Update proposal
- `DELETE /api/proposals/[id]` - Delete proposal
- `POST /api/proposals/[id]/duplicate` - Duplicate proposal
- `GET /api/proposals/[id]/versions` - Get version history
- `POST /api/proposals/[id]/send` - Send proposal to customer

### Company Configuration
- `GET/PATCH /api/company/settings` - Company settings
- `GET/POST /api/company/hvac-systems` - HVAC systems
- `GET/POST /api/company/addons` - Add-ons
- `GET/POST /api/company/materials` - Materials
- `GET/POST /api/company/labor-rates` - Labor rates
- `GET/POST /api/company/permits` - Permit fees
- `GET/POST /api/company/pricebook` - Price book units
- `GET/POST /api/company/financing-options` - Financing options
- `GET/POST /api/company/maintenance-plans` - Maintenance plans
- `GET/POST /api/company/incentives` - Incentives

### Finance
- `POST /api/finance/lightreach/apply` - Submit finance application
- `GET /api/finance/lightreach/status/[id]` - Get application status

### E-Signature
- `POST /api/signatures/send` - Send signature request
- `GET /api/signatures/[id]/status` - Get signature status

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Connect Neon database
5. Deploy

Vercel will automatically:
- Run `prisma generate` during build
- Run `prisma migrate deploy` (add to build command if needed)

### Database Migrations in Production

```bash
# Run migrations
npx prisma migrate deploy

# Or add to Vercel build command:
# prisma migrate deploy && next build
```

### Neon Branching Strategy

1. **Production**: Main branch with production connection string
2. **Staging**: Staging branch for testing
3. **Development**: Dev branch with auto-reset feature

Each environment should have its own Neon branch and connection string.

## Development Notes

### NextAuth Compatibility

The project uses NextAuth v5 beta. If you encounter adapter issues, you may need to:
- Use NextAuth v4 instead
- Or update the Prisma adapter configuration

### Local Development

1. Use Neon's development branch for local development
2. Enable auto-reset on dev branch for clean testing
3. Use separate connection strings for each environment

### Testing

- API routes can be tested with tools like Postman or curl
- E2E testing can be set up with Playwright or Cypress
- Unit tests can be added with Jest

## Support

For issues or questions, please refer to:
- Prisma documentation: https://www.prisma.io/docs
- NextAuth documentation: https://next-auth.js.org
- Neon documentation: https://neon.tech/docs

## License

[Your License Here]
