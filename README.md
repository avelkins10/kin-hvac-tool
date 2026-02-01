# HVAC Proposal Builder

A full-stack transactional platform for creating, managing, and processing HVAC proposals with finance integration and e-signature capabilities.

## Features

- **Authentication & Authorization**: Supabase Auth with role-based access control (Super Admin, Company Admin, Sales Rep, Customer)
- **Proposal Management**: Create, edit, duplicate, and track proposals with version history
- **Company Configuration**: Admin portal for managing pricing, equipment, add-ons, materials, labor rates, and more
- **Finance Integration**: LightReach API integration for financing applications
- **E-Signature**: SignNow integration for digital agreement signing
- **Email Notifications**: Automated emails for proposals, signatures, and finance approvals
- **Customer Portal**: Public proposal viewing with secure access
- **Database**: PostgreSQL with Prisma ORM (Supabase PostgreSQL)

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **UI**: React 19, Tailwind CSS, Radix UI
- **PDF Generation**: jsPDF
- **Email**: Nodemailer
- **Finance API**: LightReach
- **E-Signature**: SignNow

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database (Supabase PostgreSQL)
- Accounts for:
  - LightReach (finance API)
  - SignNow (e-signature)
  - SMTP email service (Gmail, SendGrid, etc.)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get the **Transaction pooler** connection string from **Settings → Database** (port 6543)
4. If migrating from Neon, see **SUPABASE_MIGRATION_EXECUTION_GUIDE.md** for the full step-by-step guide

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string (Transaction pooler recommended)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role key
- `OPENAI_API_KEY`: For nameplate analysis
- `PALMETTO_FINANCE_ACCOUNT_EMAIL`: Palmetto Finance service account email
- `PALMETTO_FINANCE_ACCOUNT_PASSWORD`: Palmetto Finance service account password
- `PALMETTO_FINANCE_ENVIRONMENT`: Environment ('next' for staging, 'prod' for production)
- `SIGNNOW_*`: SignNow API credentials (SIGNNOW_API_HOST, SIGNNOW_BASIC_TOKEN, SIGNNOW_USERNAME, SIGNNOW_PASSWORD, SIGNNOW_FROM_EMAIL)
- `SMTP_*`: Email service configuration

If your database password contains special characters (e.g. `@`), URL-encode them in the connection string (e.g. `@` → `%40`). See **GET_SUPABASE_CONNECTION_STRING.md** for details.

### 4. Set Up Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Create Initial Admin User

Create the first Supabase Auth user and link it to a company:

```bash
npm run create-admin -- your-email@example.com 'YourPassword123!' 'Your Company Name'
```

This creates a user in Supabase Auth and a corresponding `User` record in the database. See **SUPABASE_MIGRATION_EXECUTION_GUIDE.md** for migration from Neon and storage bucket setup.

### 6. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and sign in with your admin credentials.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/user/               # Current user (Supabase Auth)
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
- Sign in via Supabase Auth (client-side); session is managed by Supabase
- `GET /api/auth/user` - Get current user (role, companyId) for authenticated session

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
3. Configure environment variables in Vercel dashboard (see **SUPABASE_MIGRATION_EXECUTION_GUIDE.md** for required Supabase and `DATABASE_URL` values)
4. Deploy

Vercel will automatically:
- Run `prisma generate` and `prisma migrate deploy` during build (see `package.json` build script)

### Database Migrations in Production

```bash
# Run migrations
npx prisma migrate deploy

# Or add to Vercel build command:
# prisma migrate deploy && next build
```

### Environment Strategy

1. **Production**: Main branch with production Supabase connection string and API keys
2. **Preview**: Preview deployments can use the same or a separate Supabase project
3. **Development**: Local `.env.local` with Supabase credentials

Use the Transaction pooler connection string (port 6543) for `DATABASE_URL` in all environments.

## Development Notes

### Supabase Auth

The project uses Supabase Auth for sign-in and session management. The middleware refreshes the Supabase session and protects routes. User records are stored in the database and linked via `supabaseUserId`.

### Local Development

1. Use `.env.local` with Supabase URL, anon key, service_role key, and `DATABASE_URL` (Transaction pooler)
2. Run `npm run verify-migration-env` to confirm env vars before migration
3. See **SUPABASE_MIGRATION_EXECUTION_GUIDE.md** for full migration and verification steps

### Testing

- API routes can be tested with tools like Postman or curl
- E2E testing can be set up with Playwright or Cypress
- Unit tests can be added with Jest

## Support

For issues or questions, please refer to:
- **SUPABASE_MIGRATION_EXECUTION_GUIDE.md** – step-by-step migration and troubleshooting
- **GET_SUPABASE_CONNECTION_STRING.md** – connection string and password encoding
- Prisma documentation: https://www.prisma.io/docs
- Supabase documentation: https://supabase.com/docs

## License

[Your License Here]
