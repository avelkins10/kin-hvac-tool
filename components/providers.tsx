"use client"

import { ReactNode } from 'react'

/**
 * Providers component
 * 
 * Note: Supabase Auth doesn't require a provider like NextAuth's SessionProvider
 * Supabase handles session management via cookies automatically
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>
}
