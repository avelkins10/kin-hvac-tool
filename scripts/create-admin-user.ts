import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`User ${email} already exists. Updating password...`)
      const hashedPassword = await hashPassword(password)
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          companyId: company.id,
          role: 'COMPANY_ADMIN',
        },
      })
      console.log(`Updated user: ${email}`)
    } else {
      const hashedPassword = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
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
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
