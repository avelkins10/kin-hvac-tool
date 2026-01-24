# Creating Your First Admin User

If you're getting a 401 Unauthorized error when trying to log in, it means no user exists in the database yet, or the password is incorrect.

## Option 1: Using the Script (Recommended)

Run this command locally (make sure your `.env.local` has the correct `DATABASE_URL`):

```bash
npm run create-admin <email> <password> <company-name>
```

Example:
```bash
npm run create-admin austin@kinhome.com MyPassword123! "Kin Home"
```

If you don't provide arguments, it will use defaults:
- Email: `admin@example.com`
- Password: `Admin123!`
- Company: `Default Company`

## Option 2: Using Prisma Studio

1. Run `npx prisma studio`
2. Navigate to the `Company` table and create a company
3. Copy the company ID
4. Navigate to the `User` table and create a user with:
   - Email: your email
   - Password: **must be hashed with bcrypt** (see below)
   - Role: `COMPANY_ADMIN`
   - CompanyId: the company ID you copied

## Option 3: Direct Database Query

You can run SQL directly in your database. First, hash your password:

```javascript
// In Node.js REPL or a script
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourPassword123!', 12);
console.log(hash);
```

Then insert into your database:

```sql
-- Create company first
INSERT INTO "Company" (id, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Your Company Name', NOW(), NOW());

-- Get the company ID, then create user
INSERT INTO "User" (id, email, password, role, "companyId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'your-email@example.com',
  '$2a$12$YOUR_HASHED_PASSWORD_HERE',
  'COMPANY_ADMIN',
  'YOUR_COMPANY_ID_HERE',
  NOW(),
  NOW()
);
```

## Option 4: Using Vercel Environment Variables + API

If you have access to create users via API (requires an existing admin), you can use the `/api/users` endpoint, but this requires authentication first.

## Troubleshooting

- **401 Error**: User doesn't exist or password is wrong
- **Database Connection Error**: Check your `DATABASE_URL` environment variable
- **Password Hash Mismatch**: Make sure you're using bcrypt with 12 salt rounds

## For Production (Vercel)

You'll need to:
1. Connect to your production database
2. Run the create-admin script with your production DATABASE_URL
3. Or use Prisma Studio with production connection
4. Or run SQL directly in your Neon/PostgreSQL dashboard
