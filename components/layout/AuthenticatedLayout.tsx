"use client"

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppLayout } from './AppLayout'
import { Spinner } from '@/components/ui/spinner'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user: session, loading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/signin')
    }
  }, [loading, session, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <AppLayout>{children}</AppLayout>
}
