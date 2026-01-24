import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'

export default async function Page() {
  await requireAuth()
  redirect('/dashboard')
}
