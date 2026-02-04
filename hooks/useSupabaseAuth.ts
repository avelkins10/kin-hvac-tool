/**
 * Supabase Auth Hook
 * Provides a useSession-like interface for Supabase Auth
 * 
 * Usage: const { user, loading, signOut } = useSupabaseAuth()
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  email: string
  role: string
  companyId: string | null
  lightreachSalesRepName?: string
  lightreachSalesRepEmail?: string
  lightreachSalesRepPhone?: string
}

interface UseSupabaseAuthReturn {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Prefer cookie-based session: try /api/auth/user first so we stay in sync with
    // server (server has cookies; client getSession() can miss them after full-page nav).
    fetch('/api/auth/user', { credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((userData) => {
        if (userData) {
          setUser(userData as AuthUser)
          setLoading(false)
          return
        }
        // Fallback: client Supabase session (e.g. localStorage/cookies from client)
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            fetchUserData(session.user.id)
          } else {
            setUser(null)
            setLoading(false)
          }
        })
      })
      .catch(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            fetchUserData(session.user.id)
          } else {
            setUser(null)
            setLoading(false)
          }
        })
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (supabaseUserId: string) => {
    try {
      // Call API route to get user data (avoids exposing Prisma on client)
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/signin')
    router.refresh()
  }

  return { user, loading, signOut }
}
