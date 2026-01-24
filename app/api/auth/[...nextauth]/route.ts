import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials')
            return null
          }

          // Normalize email to lowercase for lookup
          const normalizedEmail = credentials.email.toLowerCase().trim()
          
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { company: true },
          })

          if (!user) {
            console.error('User not found:', credentials.email)
            return null
          }

          console.log('=== AUTH DEBUG ===')
          console.log('Original email:', credentials.email)
          console.log('Normalized email:', normalizedEmail)
          console.log('Password provided length:', credentials.password?.length)
          console.log('Password provided (first 3 chars):', credentials.password?.substring(0, 3))
          console.log('User found:', !!user)
          if (user) {
            console.log('User email in DB:', user.email)
            console.log('Stored hash prefix:', user.password?.substring(0, 20))
            console.log('Stored hash length:', user.password?.length)
            
            // Test the password directly with bcrypt
            const bcrypt = require('bcryptjs')
            const directTest = await bcrypt.compare(credentials.password.trim(), user.password)
            console.log('Direct bcrypt.compare result:', directTest)
            
            const isValid = await verifyPassword(credentials.password.trim(), user.password)
            console.log('verifyPassword result:', isValid)
          }
          console.log('=== END AUTH DEBUG ===')

          if (!isValid) {
            console.error('❌ AUTH FAILED - Invalid password for user:', credentials.email)
            return null
          }
          
          console.log('✅ AUTH SUCCESS for user:', credentials.email)

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.companyId = user.companyId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
