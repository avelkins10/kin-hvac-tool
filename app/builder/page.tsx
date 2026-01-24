import { requireAuth } from '@/lib/auth-helpers'
import { BuilderApp } from '@/components/builder/BuilderApp'

export default async function BuilderPage() {
  await requireAuth()
  return <BuilderApp />
}
