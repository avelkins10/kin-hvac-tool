// Load .env.local so DATABASE_URL and Supabase vars are set
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim()
      process.env[m[1]] = val
    }
  }
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL must be set. Add it to .env.local or run: DATABASE_URL=... npm run create-admin')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
})
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function createAdminUser() {
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || 'Admin123!'
  const companyName = process.argv[4] || 'Default Company'

  try {
    // Check if company exists, create if not
    let company = await prisma.company.findFirst({
      where: { name: companyName },
    })

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: companyName,
        },
      })
      console.log(`Created company: ${company.name} (${company.id})`)
    } else {
      console.log(`Using existing company: ${company.name} (${company.id})`)
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`User ${email} already exists in database.`)
      
      // If user has supabaseUserId, update password in Supabase Auth
      if (existingUser.supabaseUserId) {
        console.log('Updating password in Supabase Auth...')
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.supabaseUserId,
          { password: password.trim() }
        )
        if (updateError) {
          console.error('Error updating password in Supabase Auth:', updateError)
          throw updateError
        }
        console.log(`Updated password for Supabase Auth user: ${existingUser.supabaseUserId}`)
      } else {
        // User exists but no Supabase Auth user - create one
        console.log('Creating Supabase Auth user for existing database user...')
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          email_confirm: true,
        })
        
        if (authError || !authData.user) {
          console.error('Error creating Supabase Auth user:', authError)
          throw authError || new Error('Failed to create Supabase Auth user')
        }
        
        // Link Supabase Auth user to database user
        await prisma.user.update({
          where: { email },
          data: {
            supabaseUserId: authData.user.id,
            companyId: company.id,
            role: 'COMPANY_ADMIN',
          },
        })
        console.log(`Linked Supabase Auth user ${authData.user.id} to database user`)
      }
      
      // Update company and role if needed
      await prisma.user.update({
        where: { email },
        data: {
          companyId: company.id,
          role: 'COMPANY_ADMIN',
        },
      })
      console.log(`Updated user: ${email}`)
    } else {
      // Create new user in Supabase Auth first (or use existing Auth user)
      console.log('Creating Supabase Auth user...')
      let authUserId: string
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        email_confirm: true, // Auto-confirm email
      })

      if (authError?.code === 'email_exists' || authError?.message?.toLowerCase().includes('already been registered')) {
        // Auth user exists – list users by email and link
        const { data: listData } = await supabase.auth.admin.listUsers()
        const existingAuth = listData?.users?.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase())
        if (!existingAuth) {
          console.error('Error: Email exists in Auth but user not found in list.')
          throw authError
        }
        authUserId = existingAuth.id
        console.log(`Using existing Supabase Auth user: ${authUserId}`)
        // Optionally update password
        await supabase.auth.admin.updateUserById(authUserId, { password: password.trim() })
      } else if (authError || !authData?.user) {
        console.error('Error creating Supabase Auth user:', authError)
        throw authError || new Error('Failed to create Supabase Auth user')
      } else {
        authUserId = authData.user.id
        console.log(`Created Supabase Auth user: ${authUserId}`)
      }

      // Create User record in database
      const user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          supabaseUserId: authUserId,
          role: 'COMPANY_ADMIN',
          companyId: company.id,
        },
      })
      console.log(`Created admin user: ${email} (${user.id})`)
    }

    console.log('\n✅ Admin user created/updated successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    console.log(`Company: ${company.name}`)
    console.log('\n📝 Note: User can now log in using Supabase Auth')
  } catch (error: unknown) {
    const prismaError = error as { code?: string; message?: string }
    if (prismaError?.code === 'P2022' && prismaError?.message?.includes('column')) {
      console.error('Error: User table schema does not match Prisma schema.')
      console.error('Ensure DATABASE_URL in .env.local points to Supabase (not Neon), then run:')
      console.error('  npx prisma migrate deploy')
      console.error('Then run this script again.')
    } else {
      console.error('Error creating admin user:', error)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
