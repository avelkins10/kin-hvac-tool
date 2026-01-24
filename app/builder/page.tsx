import { requireAuth } from '@/lib/auth-helpers'
import dynamic from 'next/dynamic'

const App = dynamic(() => import('@/src/App'), { ssr: false })

export default async function BuilderPage() {
  await requireAuth()
  return <App />
}
