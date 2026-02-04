"use client"

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppLayout } from './AppLayout'
import { Spinner } from '@/components/ui/spinner'

export type ServerSessionUser = {
  id: string
  email: string
  role: string
  companyId: string | null
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  /** When the page already ran requireAuth() on the server, pass session so the client does not redirect */
  serverSession?: { user: ServerSessionUser } | null
}

export function AuthenticatedLayout({ children, serverSession }: AuthenticatedLayoutProps) {
  const { user: clientSession, loading } = useSupabaseAuth()
  const router = useRouter()
  const session = serverSession?.user ?? clientSession

  useEffect(() => {
    if (serverSession?.user) return
    if (!loading && !clientSession) {
      router.push('/auth/signin')
    }
  }, [loading, clientSession, router, serverSession?.user])

  if (serverSession?.user) {
    return <AppLayout>{children}</AppLayout>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!clientSession) {
    return null
  }

  return <AppLayout>{children}</AppLayout>
}
